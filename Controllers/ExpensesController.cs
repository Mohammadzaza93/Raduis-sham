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

namespace ISPSystem.Controllers
{
    [ApiController]
    [Route("api/expenses")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuditService _audit;

        public ExpensesController(AppDbContext context, AuditService audit)
        {
            _context = context;
            _audit = audit;
        }

        // ➕ إضافة مصروف جديد (مع تسجيل العملية في الأرشيف)
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] CreateExpenseDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("بيانات المصروف غير صالحة"));

            try
            {
                var expense = new Expense
                {
                    Amount = dto.Amount,
                    Reason = dto.Reason,
                    Category = dto.Category,
                    Date = DateTime.Now // تسجيل وقت المصروف الفعلي حالياً
                };

                _context.Expenses.Add(expense);
                await _context.SaveChangesAsync();

                // 📝 تتبع النظام: تسجيل عملية الإضافة ماليًا
                await _audit.Log("Create", "Expense", expense.Id);

                return Ok(ApiResponse<Expense>.Ok(expense));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // 🔄 تعديل بيانات مصروف سابق
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateExpenseDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("البيانات المرسلة فارغة"));

            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
                return NotFound(ApiResponse<string>.Fail("المصروف المطلوب غير موجود"));

            expense.Amount = dto.Amount;
            expense.Reason = dto.Reason;
            expense.Category = dto.Category;

            await _context.SaveChangesAsync();
            await _audit.Log("Update", "Expense", id);

            return Ok(ApiResponse<Expense>.Ok(expense));
        }

        // ❌ حذف مصروف نهائيًا من النظام
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // تقييد الحذف المالي للمسؤولين فقط لحماية الحسابات
        public async Task<IActionResult> Delete(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
                return NotFound(ApiResponse<string>.Fail("المصروف المطلوب غير موجود"));

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            await _audit.Log("Delete", "Expense", id);

            return Ok(ApiResponse<string>.Ok("تم حذف المصروف بنجاح"));
        }

        // 📋 جلب كافة المصروفات مرتبة من الأحدث إلى الأقدم
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var expenses = await _context.Expenses
                    .OrderByDescending(e => e.Date) // ⚡ تحسين: عرض المصاريف الأحدث أولاً في الجدول
                    .ToListAsync();

                return Ok(ApiResponse<List<Expense>>.Ok(expenses));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}