import { useState, useEffect, useRef } from 'react';
import { Download, Plus, Save, Trash, Upload } from 'lucide-react';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Main App Component
export default function InvoiceCreator() {
  // State for invoice data
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState({
    id: Date.now(),
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    clientName: '',
    clientAddress: '',
    yourName: '',
    yourAddress: '',
    logoUrl: null,
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    notes: '',
    subtotal: 0,
    tax: 0,
    total: 0
  });
  
  // Ref for file input
  const fileInputRef = useRef(null);
  
  // Load invoices from localStorage on component mount
  useEffect(() => {
    const savedInvoices = localStorage.getItem('webvoi-invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  }, []);
  
  // Save invoices to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('webvoi-invoices', JSON.stringify(invoices));
  }, [invoices]);
  
  // Calculate subtotal, tax, and total whenever items change
  useEffect(() => {
    const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * (currentInvoice.tax / 100);
    const total = subtotal + tax;
    
    setCurrentInvoice(prev => ({
      ...prev,
      subtotal: subtotal,
      total: total
    }));
  }, [currentInvoice.items, currentInvoice.tax]);
  
  // Handle general input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentInvoice(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentInvoice(prev => ({
          ...prev,
          logoUrl: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...currentInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // Add new item
  const addItem = () => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };
  
  // Remove item
  const removeItem = (index) => {
    const updatedItems = currentInvoice.items.filter((_, i) => i !== index);
    setCurrentInvoice(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // Save invoice
  const saveInvoice = () => {
    // Check if it's a new invoice or editing an existing one
    const invoiceIndex = invoices.findIndex(inv => inv.id === currentInvoice.id);
    
    if (invoiceIndex === -1) {
      // New invoice
      setInvoices(prev => [...prev, currentInvoice]);
    } else {
      // Update existing invoice
      const updatedInvoices = [...invoices];
      updatedInvoices[invoiceIndex] = currentInvoice;
      setInvoices(updatedInvoices);
    }
    
    // Create a new empty invoice
    setCurrentInvoice({
      id: Date.now(),
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      clientName: '',
      clientAddress: '',
      yourName: '',
      yourAddress: '',
      logoUrl: null,
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      notes: '',
      subtotal: 0,
      tax: 0,
      total: 0
    });
  };
  
  // Load an invoice from history
  const loadInvoice = (invoice) => {
    setCurrentInvoice(invoice);
  };
  
  // Download invoice as PDF
  const downloadInvoice = () => {
    // Create a temporary div to hold our invoice HTML
    const invoiceElement = document.createElement('div');
    invoiceElement.className = 'invoice-container';
    invoiceElement.style.width = '210mm'; // A4 width
    invoiceElement.style.padding = '20mm';
    invoiceElement.style.backgroundColor = 'white';
    invoiceElement.style.fontFamily = 'Arial, sans-serif';
    
    // Create invoice HTML structure
    const invoiceHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          ${currentInvoice.logoUrl ? `<img src="${currentInvoice.logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px;" />` : ''}
          <h2 style="margin-top: 10px; color: #333;">${currentInvoice.yourName || 'Your Company'}</h2>
          <p style="white-space: pre-line; color: #666;">${currentInvoice.yourAddress || ''}</p>
        </div>
        <div style="text-align: right;">
          <h1 style="color: #1a56db; font-size: 28px; margin-bottom:
10px;">INVOICE</h1>
          <p><strong>Invoice #:</strong> ${currentInvoice.invoiceNumber || currentInvoice.id}</p>
          <p><strong>Date:</strong> ${currentInvoice.date || ''}</p>
          <p><strong>Due Date:</strong> ${currentInvoice.dueDate || ''}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="color: #333; margin-bottom: 5px;">Bill To:</h3>
          <p style="font-weight: bold;">${currentInvoice.clientName || ''}</p>
          <p style="white-space: pre-line; color: #666;">${currentInvoice.clientAddress || ''}</p>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Description</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Rate</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${currentInvoice.items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.rate.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px; text-align: right;">${currentInvoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax (${currentInvoice.tax}%):</strong></td>
            <td style="padding: 10px; text-align: right;">${(currentInvoice.subtotal * (currentInvoice.tax / 100)).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">${currentInvoice.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      ${currentInvoice.notes ? `
        <div style="margin-top: 30px;">
          <h3 style="color: #333; margin-bottom: 5px;">Notes:</h3>
          <p style="white-space: pre-line; color: #666;">${currentInvoice.notes}</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        <p>Thank you for your business!</p>
      </div>
    `;
    
    invoiceElement.innerHTML = invoiceHTML;
    document.body.appendChild(invoiceElement);
    
    // Use html2canvas to convert the invoice to an image
    // In a real-world implementation, we would use a proper PDF library
    // For this demonstration, we'll create an SVG using D3 to render our HTML
    
    // Create a simple SVG containing the invoice content
    // Import html2canvas and jspdf at the top of your file

    // Convert the invoice element to canvas, then to PDF
    html2canvas(invoiceElement, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true // Enable CORS for images
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${currentInvoice.invoiceNumber || currentInvoice.id}.pdf`);

      // Clean up
      document.body.removeChild(invoiceElement);
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">WebVoi</h1>
          <p className="text-sm">Modern Invoice Creator</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto flex flex-col md:flex-row gap-8 p-4 flex-grow">
        {/* Invoice Editor */}
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Create Your Invoice</h2>
          
          {/* Top Section: Logo and Invoice Info */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Logo Upload */}
            <div className="w-full md:w-1/3">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current.click()}
              >
                {currentInvoice.logoUrl ? (
                  <img 
                    src={currentInvoice.logoUrl} 
                    alt="Company Logo" 
                    className="max-h-36 max-w-full object-contain"
                  />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Upload your logo</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleLogoUpload} 
              />
            </div>
            
            {/* Invoice Info */}
            <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={currentInvoice.invoiceNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="INV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={currentInvoice.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={currentInvoice.dueDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  name="tax"
                  value={currentInvoice.tax}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          {/* Client and Sender Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Your Info */}
            <div>
              <h3 className="text-lg font-medium mb-2">Your Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name/Company</label>
                  <input
                    type="text"
                    name="yourName"
                    value={currentInvoice.yourName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Address</label>
                  <textarea
                    name="yourAddress"
                    value={currentInvoice.yourAddress}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Your Address"
                  />
                </div>
              </div>
            </div>
            
            {/* Client Info */}
            <div>
              <h3 className="text-lg font-medium mb-2">Client Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={currentInvoice.clientName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Client Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                  <textarea
                    name="clientAddress"
                    value={currentInvoice.clientAddress}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Client Address"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Invoice Items */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Invoice Items</h3>
              <button 
                onClick={addItem}
                className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Description</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 w-20">Qty</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 w-32">Rate</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 w-32">Amount</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Item description"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <div className="p-2 border border-gray-100 bg-gray-50 rounded-md">
                          {(item.quantity * item.rate).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {currentInvoice.items.length > 1 && (
                          <button 
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="py-2 px-4 text-right text-sm font-medium">Subtotal:</td>
                    <td className="py-2 px-4 text-sm font-medium">${currentInvoice.subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="py-2 px-4 text-right text-sm font-medium">Tax ({currentInvoice.tax}%):</td>
                    <td className="py-2 px-4 text-sm font-medium">${(currentInvoice.subtotal * (currentInvoice.tax / 100)).toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="py-2 px-4 text-right text-sm font-bold">Total:</td>
                    <td className="py-2 px-4 text-lg font-bold">${currentInvoice.total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={currentInvoice.notes}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-end">
            <button
              onClick={saveInvoice}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              <Save className="h-5 w-5 mr-2" /> Save Invoice
            </button>
            <button
              onClick={downloadInvoice}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              <Download className="h-5 w-5 mr-2" /> Download Invoice
            </button>
          </div>
        </div>
        
        {/* Invoice History */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-lg p-6 h-min">
          <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
          
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No saved invoices yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadInvoice(invoice)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">
                      {invoice.invoiceNumber || `Invoice #${invoice.id.toString().slice(-4)}`}
                    </h3>
                    <span className="text-sm text-blue-600">${invoice.total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {invoice.clientName || 'Unnamed Client'} • {invoice.date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} WebVoi - Modern Invoice Creator</p>
      </footer>
    </div>
  );
}