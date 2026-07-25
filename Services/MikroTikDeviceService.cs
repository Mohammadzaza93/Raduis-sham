using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ISPSystem.Services
{
    public class MikroTikDeviceService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<MikroTikDeviceService> _logger;

        public MikroTikDeviceService(AppDbContext context, ILogger<MikroTikDeviceService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<MikroTikDevice>> GetAll()
        {
            return await _context.MikroTikDevices
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        public async Task<MikroTikDevice> GetById(int id)
        {
            return await _context.MikroTikDevices.FindAsync(id);
        }

        public async Task<MikroTikDevice> Create(MikroTikDevice device)
        {
            device.CreatedAt = DateTime.Now;
            device.IsOnline = false;
            _context.MikroTikDevices.Add(device);
            await _context.SaveChangesAsync();
            return device;
        }

        public async Task<MikroTikDevice> Update(int id, MikroTikDevice dto)
        {
            var device = await _context.MikroTikDevices.FindAsync(id);
            if (device == null) return null;

            device.Name = dto.Name;
            device.IpAddress = dto.IpAddress;
            device.Username = dto.Username;
            if (!string.IsNullOrEmpty(dto.Password))
                device.Password = dto.Password;
            device.ApiPort = dto.ApiPort;
            device.IsEnabled = dto.IsEnabled;
            device.Location = dto.Location;
            device.Notes = dto.Notes;

            await _context.SaveChangesAsync();
            return device;
        }

        public async Task<bool> Delete(int id)
        {
            var device = await _context.MikroTikDevices.FindAsync(id);
            if (device == null) return false;

            _context.MikroTikDevices.Remove(device);
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// ›Õ’ Õ«·… «·« ’«· »ÃÂ«“ Ê«Õœ
        /// </summary>
        public async Task<MikroTikDevice> CheckConnection(int id)
        {
            var device = await _context.MikroTikDevices.FindAsync(id);
            if (device == null) return null;

            try
            {
                using var client = new TcpClient();
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(4));

                await client.ConnectAsync(device.IpAddress, device.ApiPort, cts.Token);

                device.IsOnline = client.Connected;
                device.LastError = null;
            }
            catch (Exception ex)
            {
                device.IsOnline = false;
                device.LastError = ex.Message;
            }

            device.LastCheckedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return device;
        }

        /// <summary>
        /// ›Õ’ Ã„Ì⁄ «·√ÃÂ“…
        /// </summary>
        public async Task<List<MikroTikDevice>> CheckAllConnections()
        {
            var devices = await _context.MikroTikDevices
                .Where(d => d.IsEnabled)
                .ToListAsync();

            foreach (var device in devices)
            {
                try
                {
                    using var client = new TcpClient();
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                    await client.ConnectAsync(device.IpAddress, device.ApiPort, cts.Token);
                    device.IsOnline = client.Connected;
                    device.LastError = null;
                }
                catch (Exception ex)
                {
                    device.IsOnline = false;
                    device.LastError = ex.Message;
                }

                device.LastCheckedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return devices;
        }
    }
}