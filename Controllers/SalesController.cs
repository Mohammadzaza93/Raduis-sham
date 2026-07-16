using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ISPSystem.Services;
using ISPSystem.Helpers;
using ISPSystem.Models;
using ISPSystem.DTOs; // تأكد من احتواء هذا الـ namespace على الـ DTOs الخاصة بالنظام
using System;
using System.Threading.Tasks;

namespace ISPSystem.backend.Controllers
{
    [ApiController]
    [Route("api/sales")]
    [Authorize] // 🔐 تأمين حركات المبيعات والمخازن
    public class SalesController : ControllerBase
    {
        private readonly SaleService _service;

        public SalesController(SaleService service)
        {
            _service = service;
        }

        // 📦 تسجيل عملية بيع معدات (مثل راوترات، كابلات، أو أجهزة استقبال)
        [HttpPost("sell")]
        [Authorize(Roles = "Admin,Accountant,SalesPerson")] // تقييد الوصول للموظفين المسؤولين عن البيع
        public async Task<IActionResult> Sell([FromBody] CreateSaleDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("بيانات طلب البيع غير صالحة"));

            if (dto.Quantity <= 0)
                return BadRequest(ApiResponse<string>.Fail("كمية البيع يجب أن تكون أكبر من الصفر"));

            try
            {
                // تنفيذ عملية البيع عبر السيرفس لخصم الكمية من المخزن وتوليد القيد المالي
                var sale = await _service.Sell(dto.ProductId, dto.Quantity);
                return Ok(ApiResponse<Sale>.Ok(sale));
            }
            catch (Exception ex)
            {
                // التعامل مع استثناءات العمل مثل (نفاد الكمية من المخزن أو عدم وجود المنتج)
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }
    }

    // 🗂️ نقل معاملات الطلب إلى كائن DTO مخصص لمطابقة المعايير القياسية
    public class CreateSaleDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}