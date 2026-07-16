using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ISPSystem.Services
{
    public class MikroTikService
    {
        private readonly string _host;
        private readonly string _username;
        private readonly string _password;
        private readonly int _port;

        public MikroTikService(IConfiguration config)
        {
            _host = config["MikroTik:Ip"];
            _username = config["MikroTik:User"];
            _password = config["MikroTik:Pass"];
            _port = config.GetValue<int>("MikroTik:ApiPort", 8729);
        }

        private async Task<string> SendCommandAsync(string command)
        {
            using var client = new TcpClient();
            await client.ConnectAsync(_host, _port);

            using var stream = client.GetStream();
            var data = Encoding.ASCII.GetBytes(command + "\r\n");
            await stream.WriteAsync(data, 0, data.Length);

            var response = new StringBuilder();
            var buffer = new byte[8192];
            int bytesRead;

            do
            {
                bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
                response.Append(Encoding.ASCII.GetString(buffer, 0, bytesRead));
            } while (bytesRead == buffer.Length);

            return response.ToString();
        }

        private async Task<bool> Login()
        {
            var response = await SendCommandAsync("/login");
            if (response.Contains("=ret="))
            {
                var start = response.IndexOf("=ret=") + 5;
                var end = response.IndexOf("\r\n", start);
                var token = response.Substring(start, end - start);

                var loginCmd = $"/login\r\n=name={_username}\r\n=response=00{token}\r\n";
                var loginResponse = await SendCommandAsync(loginCmd);
                return loginResponse.Contains("!done");
            }
            return false;
        }

        private async Task<string> ExecuteAsync(string command)
        {
            await Login();
            return await SendCommandAsync(command);
        }

        public async Task<List<ActiveUser>> GetActiveUsers()
        {
            var users = new List<ActiveUser>();
            try
            {
                var response = await ExecuteAsync("/ppp/active/print");
                var lines = response.Split('\n');

                string currentName = null;
                string currentAddress = null;

                foreach (var line in lines)
                {
                    if (line.StartsWith("=.name="))
                        currentName = line.Substring(7).Trim();
                    if (line.StartsWith("=.address="))
                        currentAddress = line.Substring(10).Trim();

                    if (currentName != null && currentAddress != null)
                    {
                        users.Add(new ActiveUser { Name = currentName, Address = currentAddress });
                        currentName = null;
                        currentAddress = null;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Error: {ex.Message}");
            }
            return users;
        }

        public async Task<List<PppUser>> GetAllPppUsers()
        {
            var users = new List<PppUser>();
            try
            {
                var response = await ExecuteAsync("/ppp/secret/print");
                var lines = response.Split('\n');

                string currentName = null;
                string currentProfile = null;

                foreach (var line in lines)
                {
                    if (line.StartsWith("=.name="))
                        currentName = line.Substring(7).Trim();
                    if (line.StartsWith("=.profile="))
                        currentProfile = line.Substring(10).Trim();

                    if (currentName != null && currentProfile != null)
                    {
                        users.Add(new PppUser { Name = currentName, Profile = currentProfile });
                        currentName = null;
                        currentProfile = null;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Error: {ex.Message}");
            }
            return users;
        }

        public async Task<bool> AddPppUser(string username, string password, string profile, string comment = "")
        {
            try
            {
                var command = $"/ppp/secret/add\r\n=name={username}\r\n=password={password}\r\n=profile={profile}\r\n=comment={comment}\r\n=disabled=no";
                var response = await ExecuteAsync(command);
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Add User Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> RemovePppUser(string username)
        {
            try
            {
                var response = await ExecuteAsync($"/ppp/secret/remove\r\n=.id={username}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Remove User Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DisablePppUser(string username)
        {
            try
            {
                var response = await ExecuteAsync($"/ppp/secret/disable\r\n=.id={username}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Disable User Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> EnablePppUser(string username)
        {
            try
            {
                var response = await ExecuteAsync($"/ppp/secret/enable\r\n=.id={username}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Enable User Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UpdateUserSpeed(string username, string newProfile)
        {
            try
            {
                var response = await ExecuteAsync($"/ppp/secret/set\r\n=.id={username}\r\n=profile={newProfile}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Update Speed Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> BlockUserByAddress(string address, string comment = "Blocked by ISP System")
        {
            try
            {
                var response = await ExecuteAsync($"/ip/firewall/address-list/add\r\n=list=blocked\r\n=address={address}\r\n=comment={comment}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Block Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UnblockUserByAddress(string address)
        {
            try
            {
                var response = await ExecuteAsync($"/ip/firewall/address-list/remove\r\n=.id={address}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Unblock Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> AddProfile(string name, string rateLimit, string parentQueue = "none")
        {
            try
            {
                var response = await ExecuteAsync($"/ppp/profile/add\r\n=name={name}\r\n=rate-limit={rateLimit}");
                return response.Contains("!done");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Add Profile Error: {ex.Message}");
                return false;
            }
        }
    }

    public class ActiveUser
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public string Uptime { get; set; }
        public long BytesIn { get; set; }
        public long BytesOut { get; set; }
    }

    public class PppUser
    {
        public string Name { get; set; }
        public string Profile { get; set; }
        public bool Disabled { get; set; }
        public string Comment { get; set; }
    }
}