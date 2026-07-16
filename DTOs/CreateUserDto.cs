using System.ComponentModel.DataAnnotations;

namespace ISPSystem.DTOs
{
    public class CreateUserDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [MinLength(4)]
        public string Password { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; }

        [Phone]
        public string Phone { get; set; }
        [EmailAddress]
        public string Email { get; set; }
        public string Status { get; set; } = "Active";
        public string Role { get; set; } = "Employee";
        public int PlanId { get; set; }
    }
}