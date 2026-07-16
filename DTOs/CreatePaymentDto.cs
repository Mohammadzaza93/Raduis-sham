using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace ISPSystem.DTOs
{
    public class CreatePaymentDto
    {
        public int UserId { get; set; }
        public decimal Amount { get; set; }
    }
}
