using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.DTOs;
using ISPSystem.Helpers;
using ISPSystem.Models;
using ISPSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ISPSystem.backend.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize] // 🔐 تأمين عمليات الدفع والقيود المالية
    public class PaymentsController : ControllerBase
    {
        private readonly PaymentService _service;

        public PaymentsController(PaymentService service)
        {
            _service = service;
        }

        // 💳 معالجة عملية دفع جديدة (تسديد اشتراك أو فاتورة)
        [HttpPost]
        [Authorize(Roles = "Admin,Accountant")] // حصر تسجيل المدفوعات اليدوية على الإدارة والمحاسبين
        public async Task<IActionResult> Pay([FromBody] CreatePaymentDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("بيانات الدفع المرسلة غير صالحة"));

            try
            {
                // استدعاء خدمة الدفع لمعالجة الحركة المالية وتحديث حالة حساب العميل
                var payment = await _service.Pay(dto.UserId, dto.Amount);
                return Ok(ApiResponse<Payment>.Ok(payment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // 📋 جلب كافة عمليات السداد والمدفوعات المسجلة في النظام
        [HttpGet]
        [Authorize(Roles = "Admin,Accountant")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var payments = await _service.GetAll();
                return Ok(ApiResponse<IEnumerable<Payment>>.Ok(payments));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}