using System.ComponentModel.DataAnnotations;

namespace ISPSystem.DTOs
{
    public class UpdateUserDto
    {
        [Required]
        [StringLength(50)]
        public string FullName { get; set; }

        [Phone]
        public string Phone { get; set; }
        [EmailAddress]
        public string Email { get; set; }
        public string Role { get; set; }
    }
}