// backend/Services/RadiusClientService.cs
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using ISPSystem.Models;
using System.Security.Cryptography;
using System.Linq;

namespace ISPSystem.Services
{
    public class RadiusClientService
    {
        private readonly RadiusServerConfig _config;
        private readonly ILogger<RadiusClientService> _logger;

        public RadiusClientService(IOptions<RadiusServerConfig> config, ILogger<RadiusClientService> logger)
        {
            _config = config.Value;
            _logger = logger;
        }

        // „’«œﬁ… «·„” Œœ„ ⁄»— RADIUS
        public async Task<RadiusResponse> AuthenticateAsync(string username, string password, string? nasIp = null, string? macAddress = null)
        {
            try
            {
                var request = CreateAuthRequest(username, password, nasIp, macAddress);
                var response = await SendRadiusRequestAsync(request, _config.Port);

                //  ÕÊÌ· «·”„«  „‰ Dictionary<byte, string> ≈·Ï Dictionary<string, string>
                var attributes = new Dictionary<string, string>();
                foreach (var attr in response.Attributes)
                {
                    attributes[attr.Key.ToString()] = attr.Value;
                }

                return new RadiusResponse
                {
                    Success = response.Code == RadiusCode.AccessAccept,
                    Code = response.Code.ToString(),
                    Message = response.Code == RadiusCode.AccessAccept ? "Authentication successful" : "Authentication failed",
                    Attributes = attributes
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"RADIUS authentication error: {ex.Message}");
                return new RadiusResponse
                {
                    Success = false,
                    Code = "Error",
                    Message = $"Connection error: {ex.Message}",
                    Attributes = new Dictionary<string, string>()
                };
            }
        }

        // ≈‰‘«¡ ÿ·» „’«œﬁ…
        private RadiusPacket CreateAuthRequest(string username, string password, string? nasIp = null, string? macAddress = null)
        {
            var packet = new RadiusPacket
            {
                Code = RadiusCode.AccessRequest,
                Identifier = (byte)new Random().Next(0, 255),
                Authenticator = CreateAuthenticator(),
                Attributes = new Dictionary<byte, string>()
            };

            // ≈÷«›… «·”„«  «·√”«”Ì…
            packet.Attributes[1] = username; // User-Name
            packet.Attributes[2] = password; // User-Password (”Ì „  ‘›Ì—Â)
            packet.Attributes[4] = "0"; // NAS-IP-Address
            packet.Attributes[5] = "0"; // NAS-Port
            packet.Attributes[6] = "1"; // Service-Type (Login)
            packet.Attributes[7] = "1"; // Framed-Protocol (PPP)
            packet.Attributes[8] = "255.255.255.255"; // Framed-IP-Address
            packet.Attributes[32] = "0"; // NAS-Identifier

            if (!string.IsNullOrEmpty(nasIp))
            {
                packet.Attributes[4] = nasIp;
            }

            if (!string.IsNullOrEmpty(macAddress))
            {
                packet.Attributes[30] = macAddress; // Calling-Station-Id
            }

            return packet;
        }

        // ≈—”«· ÿ·» RADIUS ⁄»— UDP
        private async Task<RadiusPacket> SendRadiusRequestAsync(RadiusPacket request, int port)
        {
            using var client = new UdpClient();
            client.Connect(_config.Host, port);
            client.Client.ReceiveTimeout = _config.Timeout * 1000;

            //  ÕÊÌ· «·ÿ·» ≈·Ï »«Ì 
            var requestBytes = request.ToBytes(_config.Secret);
            await client.SendAsync(requestBytes, requestBytes.Length);

            // «” ﬁ»«· «·—œ
            var receiveTask = client.ReceiveAsync();
            var timeoutTask = Task.Delay(_config.Timeout * 1000);

            var completedTask = await Task.WhenAny(receiveTask, timeoutTask);

            if (completedTask == timeoutTask)
            {
                throw new TimeoutException("RADIUS server did not respond");
            }

            var result = await receiveTask;
            var responseBytes = result.Buffer;

            //  Õ·Ì· «·—œ
            var response = RadiusPacket.FromBytes(responseBytes, _config.Secret);

            return response;
        }

        // ≈‰‘«¡ „’«œﬁ ⁄‘Ê«∆Ì
        private byte[] CreateAuthenticator()
        {
            var authenticator = new byte[16];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(authenticator);
            return authenticator;
        }
    }

    // ›∆«  „”«⁄œ…
    public enum RadiusCode : byte
    {
        AccessRequest = 1,
        AccessAccept = 2,
        AccessReject = 3,
        AccountingRequest = 4,
        AccountingResponse = 5,
        AccessChallenge = 11,
        DisconnectRequest = 40,
        DisconnectACK = 41,
        DisconnectNAK = 42
    }

    public class RadiusPacket
    {
        public RadiusCode Code { get; set; }
        public byte Identifier { get; set; }
        public byte[] Authenticator { get; set; } = new byte[16];
        public Dictionary<byte, string> Attributes { get; set; } = new Dictionary<byte, string>();

        public byte[] ToBytes(string secret)
        {
            using var ms = new MemoryStream();
            using var writer = new BinaryWriter(ms);

            // Code, Identifier, Length (placeholder)
            writer.Write((byte)Code);
            writer.Write(Identifier);
            writer.Write((short)0); // Length - will be updated later

            // Authenticator (16 bytes)
            writer.Write(Authenticator);

            // Attributes
            foreach (var attr in Attributes)
            {
                var valueBytes = Encoding.ASCII.GetBytes(attr.Value);
                writer.Write(attr.Key);
                writer.Write((byte)(valueBytes.Length + 2));
                writer.Write(valueBytes);
            }

            // Update length
            var bytes = ms.ToArray();
            var length = (short)bytes.Length;
            BitConverter.GetBytes(length).CopyTo(bytes, 2);

            return bytes;
        }

        public static RadiusPacket FromBytes(byte[] bytes, string secret)
        {
            var packet = new RadiusPacket();
            using var ms = new MemoryStream(bytes);
            using var reader = new BinaryReader(ms);

            packet.Code = (RadiusCode)reader.ReadByte();
            packet.Identifier = reader.ReadByte();
            var length = reader.ReadUInt16();
            packet.Authenticator = reader.ReadBytes(16);

            // ﬁ—«¡… «·”„« 
            while (ms.Position < length)
            {
                var type = reader.ReadByte();
                var attrLength = reader.ReadByte();
                var value = reader.ReadBytes(attrLength - 2);
                packet.Attributes[type] = Encoding.ASCII.GetString(value);
            }

            return packet;
        }
    }

    public class RadiusResponse
    {
        public bool Success { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, string> Attributes { get; set; } = new Dictionary<string, string>();
    }
}