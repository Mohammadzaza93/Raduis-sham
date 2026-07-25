namespace ISPSystem.DTOs
{
    public class CreatePurchaseDto
    {
        public int? ProductId { get; set; }               // ÅĞÇ ßÇä ÇáãäÊÌ ãæÌæÏ ãÓÈŞÇğ
        public string ProductName { get; set; }           // ÅĞÇ ßÇä ãäÊÌ ÌÏíÏ
        public string ModelNumber { get; set; }
        public int Quantity { get; set; }
        public decimal CostPerUnit { get; set; }
        public string Supplier { get; set; }
        public string InvoiceNumber { get; set; }
        public string Notes { get; set; }
        public bool UpdateProductCostPrice { get; set; } = true; // ÊÍÏíË ÓÚÑ ÇáÔÑÇÁ İí ÇáãäÊÌ
    }
}