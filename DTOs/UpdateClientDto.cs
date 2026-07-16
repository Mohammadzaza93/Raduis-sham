// backend/DTOs/UpdateClientDto.cs
#nullable enable
namespace ISPSystem.DTOs
{
    public class UpdateClientDto
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? Status { get; set; }
        public string? MacAddress { get; set; }
        public string? IpAddress { get; set; }
    }
}