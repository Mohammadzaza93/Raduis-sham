using System.ComponentModel.DataAnnotations;

namespace ISPSystem.DTOs
{
    public class CreateClientDto
    {
        [Required]
        public string NationalId { get; set; }  // الرقم الوطني (يستخدم للإيميل)

        [Required]
        [StringLength(100)]
        public string FullName { get; set; }

        [Required]
        [Phone]
        public string Phone { get; set; }

        public string Address { get; set; }

        [Required]
        public int PlanId { get; set; }

        public string PaymentMethod { get; set; } = "Cash";

        // ملاحظة: Username, Email, Password, MacAddress, IpAddress سيتم إنشاؤها تلقائياً
    }
}