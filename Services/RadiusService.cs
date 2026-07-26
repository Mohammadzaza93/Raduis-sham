using MySqlConnector;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace ISPSystem.Services
{
    public class RadiusService
    {
        private readonly string _connectionString;
        private readonly ILogger<RadiusService> _logger;

        public RadiusService(IConfiguration config, ILogger<RadiusService> logger)
        {
            _connectionString = config.GetConnectionString("RadiusConnection")
                ?? config.GetConnectionString("DefaultConnection");
            _logger = logger;
        }

        public async Task<bool> CreateUser(string username, string password, string speed, DateTime? expiration = null)
        {
            try
            {
                await using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();

                await DeleteUserInternal(conn, username);

                await Exec(conn,
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u,'Cleartext-Password',':=',@p)",
                    ("@u", username), ("@p", password));

                if (!string.IsNullOrWhiteSpace(speed))
                {
                    var rate = NormalizeSpeed(speed);
                    await Exec(conn,
                        "INSERT INTO radreply (username, attribute, op, value) VALUES (@u,'Mikrotik-Rate-Limit',':=',@s)",
                        ("@u", username), ("@s", rate));
                }

                if (expiration.HasValue)
                {
                    var exp = expiration.Value.ToString("dd MMM yyyy HH:mm:ss",
                        System.Globalization.CultureInfo.InvariantCulture);
                    await Exec(conn,
                        "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u,'Expiration',':=',@e)",
                        ("@u", username), ("@e", exp));
                }

                _logger.LogInformation("RADIUS CreateUser OK: {User}", username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RADIUS CreateUser failed: {User}", username);
                return false; // لا يرمي Exception حتى لا يطيح التطبيق
            }
        }

        public async Task<bool> EnableUser(string username)
        {
            try
            {
                await using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();
                await Exec(conn, "DELETE FROM radcheck WHERE username=@u AND attribute='Auth-Type'", ("@u", username));
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RADIUS EnableUser failed: {User}", username);
                return false;
            }
        }

        public async Task<bool> DisableUser(string username)
        {
            try
            {
                await using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();
                await Exec(conn, "DELETE FROM radcheck WHERE username=@u AND attribute='Auth-Type'", ("@u", username));
                await Exec(conn,
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u,'Auth-Type',':=','Reject')",
                    ("@u", username));
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RADIUS DisableUser failed: {User}", username);
                return false;
            }
        }

        public async Task<bool> UpdateSpeed(string username, string speed)
        {
            try
            {
                await using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();
                var rate = NormalizeSpeed(speed);
                await Exec(conn, "DELETE FROM radreply WHERE username=@u AND attribute='Mikrotik-Rate-Limit'", ("@u", username));
                await Exec(conn,
                    "INSERT INTO radreply (username, attribute, op, value) VALUES (@u,'Mikrotik-Rate-Limit',':=',@s)",
                    ("@u", username), ("@s", rate));
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RADIUS UpdateSpeed failed: {User}", username);
                return false;
            }
        }

        public async Task<bool> UpdateExpiration(string username, DateTime expiration)
        {
            try
            {
                await using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();
                await Exec(conn, "DELETE FROM radcheck WHERE username=@u AND attribute='Expiration'", ("@u", username));
                var exp = expiration.ToString("dd MMM yyyy HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture);
                await Exec(conn,
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (@u,'Expiration',':=',@e)",
                    ("@u", username), ("@e", exp));
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RADIUS UpdateExpiration failed: {User}", username);
                return false;
            }
        }

        public async Task<bool> DeleteUser(string username)
        {
            try
            {
                await using var conn = new MySqlConnection(_connectionString);
                await conn.OpenAsync();
                await DeleteUserInternal(conn, username);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RADIUS DeleteUser failed: {User}", username);
                return false;
            }
        }

        private async Task DeleteUserInternal(MySqlConnection conn, string username)
        {
            await Exec(conn, "DELETE FROM radcheck WHERE username=@u", ("@u", username));
            await Exec(conn, "DELETE FROM radreply WHERE username=@u", ("@u", username));
            await Exec(conn, "DELETE FROM radusergroup WHERE username=@u", ("@u", username));
        }

        private async Task Exec(MySqlConnection conn, string sql, params (string n, object v)[] ps)
        {
            await using var cmd = new MySqlCommand(sql, conn);
            foreach (var p in ps)
                cmd.Parameters.AddWithValue(p.n, p.v ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        private string NormalizeSpeed(string speed)
        {
            if (string.IsNullOrWhiteSpace(speed)) return "1M/1M";
            speed = speed.Replace("Mb/s", "M").Replace("Mbps", "M").Trim();
            if (!speed.Contains("/")) speed = $"{speed}/{speed}";
            return speed;
        }
    }
}