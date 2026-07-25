using System;

namespace ISPSystem.Models
{
    public class MikroTikDevice
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string IpAddress { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public int ApiPort { get; set; } = 8728;
        public bool IsEnabled { get; set; } = true;
        public bool IsOnline { get; set; } = false;
        public DateTime? LastCheckedAt { get; set; }
        public string LastError { get; set; }
        public string Location { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

    }
}