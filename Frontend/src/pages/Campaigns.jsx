import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { User, Wifi, AlertCircle, Send, BarChart3, Users, Target, CheckCircle2, MessageSquare, Upload, FileText, Plus, X } from "lucide-react";

import MessageForm from "../components/MessageForm";
import ContactsList from "../components/ContactsList";
import Logs from "../components/Logs";
import PreviewModal from "../components/PreviewModal";
import ExportImportToolbar from "../components/ExportImportToolbar";

export default function Campaigns() {
  const [message, setMessage] = useState("");
  const [selectedChats, setSelectedChats] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [log, setLog] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  // Profile and connection state
  const [profileData, setProfileData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState("campaign");

  // CSV Import functionality (NEW - keeps existing functionality intact)
  const [csvImportedContacts, setCsvImportedContacts] = useState([]);
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Tab configuration
  const tabs = [
    { id: "campaign", label: "إعداد الحملة", icon: Send },
    { id: "analytics", label: "السجل والإحصائيات", icon: BarChart3 }
  ];

  // Delay Min + Max
  const [delayMin, setDelayMin] = useState(2000);
  const [delayMax, setDelayMax] = useState(5000);

  // بحث + فلترة
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // نافذة المعاينة
  const [showPreview, setShowPreview] = useState(false);

  // Loader + حملة
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Check profile and connection status
  const checkProfileAndConnection = async () => {
    try {
      const response = await fetch("http://localhost:5000/profile");
      const data = await response.json();

      setIsConnected(data.connected);
      setProfileData(data.profile || null);

      // Only load chats if connected
      if (data.connected) {
        const chatsResponse = await fetch("http://localhost:5000/all-chats");
        const chatsData = await chatsResponse.json();
        setAllChats(chatsData);
      } else {
        setAllChats([]);
      }
    } catch (error) {
      console.error("❌ Error checking connection:", error);
      setIsConnected(false);
      setProfileData(null);
      setAllChats([]);
    }
  };

  // Connect to WhatsApp
  const connectToWhatsApp = async () => {
    try {
      setConnectionLoading(true);
      const response = await fetch("http://localhost:5000/connect", {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        toast.success("تم بدء الاتصال - يرجى مسح رمز QR");
        // Refresh profile after connection
        setTimeout(checkProfileAndConnection, 3000);
      } else {
        toast.error(data.message || "فشل في الاتصال");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("خطأ في الاتصال");
    } finally {
      setConnectionLoading(false);
    }
  };

  useEffect(() => {
    checkProfileAndConnection();
  }, []);

  // Handle import success
  const handleImportSuccess = (importData) => {
    // Refresh the contacts list
    checkProfileAndConnection();
    toast.success(`تم استيراد ${importData.imported} جهة اتصال بنجاح`);
  };

  // تبديل اختيار فردي
  const toggleChat = (id) => {
    setSelectedChats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // اختيار / إلغاء الكل
  const toggleSelectAll = (filteredChats) => {
    const ids = filteredChats.map((c) => c.id);
    const allSelected = ids.every((id) => selectedChats.includes(id));
    if (allSelected) {
      setSelectedChats((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedChats((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  // إرسال الرسائل (مع Pause/Resume) - Enhanced with CSV support
  const sendMessages = async () => {
    if (!isConnected) {
      toast.error("يرجى الاتصال بواتساب أولاً!");
      return;
    }

    // Combine both WhatsApp selected chats and CSV imported contacts
    const totalRecipients = [...selectedChats, ...csvImportedContacts.map(c => c.id)];

    if (totalRecipients.length === 0) {
      toast.error("اختر الأفراد أو الجروبات أو استورد قائمة CSV أولاً!");
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setLoading(true);

    // Create combined recipients list with proper chat objects
    const allRecipients = [
      ...selectedChats.map(id => allChats.find(c => c.id === id)).filter(Boolean),
      ...csvImportedContacts
    ];

    for (let i = currentIndex; i < allRecipients.length; i++) {
      if (isPaused) {
        setCurrentIndex(i); // نحفظ مكان التوقف
        toast("⏸️ تم إيقاف الإرسال مؤقتًا");
        setLoading(false);
        return;
      }

      const chat = allRecipients[i];

      // إعداد البيانات
      const formData = new FormData();
      formData.append("message", message);
      formData.append("delayMin", delayMin);
      formData.append("delayMax", delayMax);
      if (imageFile) formData.append("image", imageFile);

      // Handle both WhatsApp contacts and CSV contacts
      if (chat.source === 'csv') {
        // For CSV contacts, use the number directly
        formData.append("numbers[]", chat.number);
      } else {
        // For WhatsApp contacts, use existing logic
        if (chat.isGroup) {
          formData.append("groups[]", chat.id);
        } else {
          formData.append("numbers[]", chat.id);
        }
      }

      try {
        const res = await fetch("http://localhost:5000/send", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.results) {
          setLog((prev) => [...prev, ...data.results]);
          toast.success(`تم الإرسال إلى ${chat.name}`);
        }
      } catch (err) {
        console.error("❌ Send Error:", err);
        toast.error(`فشل الإرسال إلى ${chat?.name || "مجهول"}`);
      }

      // Delay عشوائي بين الرسائل
      const delay =
        Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setLoading(false);
    toast.success("🎉 انتهت الحملة بالكامل");
  };

  // Selected Contacts Preview Component
  const SelectedContactsPreview = () => {
    const selectedContacts = selectedChats.map(id =>
      allChats.find(chat => chat.id === id)
    ).filter(Boolean);

    const contactsCount = selectedContacts.filter(c => !c.isGroup).length;
    const groupsCount = selectedContacts.filter(c => c.isGroup).length;

    const removeFromSelection = (id) => {
      setSelectedChats(prev => prev.filter(chatId => chatId !== id));
    };

    if (selectedContacts.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">لم يتم اختيار أي جهات اتصال</p>
          <p className="text-xs text-gray-400">اختر جهات الاتصال أو المجموعات لبدء الحملة</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">جهات الاتصال المحددة</h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {contactsCount} أفراد
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {groupsCount} مجموعات
            </span>
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {selectedContacts.map(contact => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${contact.isGroup ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-500">
                    {contact.isGroup ? 'مجموعة' : 'فرد'} • {contact.number || 'بدون رقم'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFromSelection(contact.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="إزالة من التحديد"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {selectedContacts.length > 0 && (
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="text-sm text-gray-600">
              المجموع: {selectedContacts.length} محدد
            </span>
            <button
              onClick={() => setSelectedChats([])}
              className="text-sm text-red-600 hover:text-red-800"
            >
              مسح الكل
            </button>
          </div>
        )}
      </div>
    );
  };

  // CSV Import Component (NEW - Addition Only)
  const CsvImportPanel = () => {
    const [csvFile, setCsvFile] = useState(null);
    const [previewContacts, setPreviewContacts] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCsvUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('يرجى اختيار ملف CSV فقط');
        return;
      }

      setCsvFile(file);
      setIsProcessing(true);

      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast.error('ملف CSV يجب أن يحتوي على عنوان وصف واحد على الأقل');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const contacts = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

          if (values.length >= 2 && values[0] && values[1]) {
            contacts.push({
              id: `csv_${Date.now()}_${i}`,
              name: values[0] || `Contact ${i}`,
              number: values[1],
              type: values[2] || 'Contact',
              isGroup: (values[3] || '').toLowerCase() === 'yes',
              source: 'csv'
            });
          }
        }

        setPreviewContacts(contacts);
        toast.success(`تم العثور على ${contacts.length} جهة اتصال في الملف`);
      } catch (error) {
        console.error('CSV processing error:', error);
        toast.error('خطأ في معالجة ملف CSV');
      } finally {
        setIsProcessing(false);
      }
    };

    const addCsvContactsToCampaign = () => {
      setCsvImportedContacts(prev => [...prev, ...previewContacts]);
      setPreviewContacts([]);
      setCsvFile(null);
      setShowCsvImport(false);
      toast.success(`تم إضافة ${previewContacts.length} جهة اتصال للحملة`);
    };

    const removeCsvContact = (id) => {
      setCsvImportedContacts(prev => prev.filter(contact => contact.id !== id));
    };

    const clearAllCsvContacts = () => {
      setCsvImportedContacts([]);
      toast.success('تم حذف جميع جهات الاتصال المستوردة');
    };

    return (
      <div className="space-y-4">
        {/* CSV Import Toggle Button */}
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700">استيراد قائمة مخصصة (CSV)</h4>
          <button
            onClick={() => setShowCsvImport(!showCsvImport)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            استيراد CSV
          </button>
        </div>

        {/* CSV Import Panel */}
        {showCsvImport && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="space-y-4">
              <div className="flex gap-2">
                <label className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 cursor-pointer flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  اختيار ملف CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>

                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:5000/import-template');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'contacts_template.csv';
                      link.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('تم تحميل النموذج');
                    } catch (error) {
                      toast.error('فشل في تحميل النموذج');
                    }
                  }}
                  className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  تحميل النموذج
                </button>
              </div>

              {isProcessing && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  جاري معالجة الملف...
                </div>
              )}

              {previewContacts.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">معاينة جهات الاتصال ({previewContacts.length})</h5>
                  <div className="max-h-40 overflow-y-auto bg-white rounded border">
                    {previewContacts.slice(0, 10).map(contact => (
                      <div key={contact.id} className="flex items-center justify-between p-2 border-b text-sm">
                        <div>
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-gray-500 ml-2">{contact.number}</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">CSV</span>
                      </div>
                    ))}
                    {previewContacts.length > 10 && (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        ... و {previewContacts.length - 10} جهة اتصال أخرى
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addCsvContactsToCampaign}
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      إضافة للحملة
                    </button>
                    <button
                      onClick={() => {
                        setPreviewContacts([]);
                        setCsvFile(null);
                        setShowCsvImport(false);
                      }}
                      className="px-4 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display CSV Imported Contacts */}
        {csvImportedContacts.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                جهات الاتصال المستوردة ({csvImportedContacts.length})
              </h5>
              <button
                onClick={clearAllCsvContacts}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                حذف الكل
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {csvImportedContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">CSV</span>
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-gray-500">{contact.number}</span>
                  </div>
                  <button
                    onClick={() => removeCsvContact(contact.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile and Connection Status */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        {!isConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-600">غير متصل بواتساب</span>
              </div>
              <p className="text-sm text-gray-600">
                يجب الاتصال بواتساب لبدء الحملات
              </p>
            </div>
            <button
              onClick={connectToWhatsApp}
              disabled={connectionLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {connectionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              اتصال بواتساب
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600">متصل بواتساب</span>
              </div>

              {profileData && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {profileData.profilePic && (
                    <img
                      src={profileData.profilePic}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <span className="font-medium">{profileData.name}</span>
                    {profileData.number && (
                      <span className="text-gray-500 ml-2">({profileData.number})</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              جاهز للإرسال • {allChats.length} محادثة متاحة
            </div>
          </div>
        )}
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" dir="rtl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "campaign" && (
            <div className="space-y-8">
              {/* Step 1: Contact Selection (Full Width Top) */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full font-bold text-lg">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">الخطوة الأولى: اختيار جهات الاتصال</h3>
                  </div>
                  <div className="flex-1 h-1 bg-blue-200 rounded-full mx-4">
                    <div className={`h-full bg-blue-500 rounded-full transition-all duration-300 ${selectedChats.length > 0 ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  {selectedChats.length > 0 && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="space-y-6">
                    {/* Export/Import Toolbar */}
                    <ExportImportToolbar
                      selectedChats={selectedChats}
                      allChats={allChats}
                      onImportSuccess={handleImportSuccess}
                    />

                    {/* Contacts List */}
                    <ContactsList
                      allChats={allChats}
                      selectedChats={selectedChats}
                      toggleChat={toggleChat}
                      toggleSelectAll={toggleSelectAll}
                      filter={filter}
                      setFilter={setFilter}
                      typeFilter={typeFilter}
                      setTypeFilter={setTypeFilter}
                      disabled={!isConnected}
                    />
                  </div>
                </div>
              </div>

              {/* Steps 2 & 3: Review and Compose (2-Column Bottom) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Step 2: Review Selected Contacts (Left Column) */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`flex items-center justify-center w-10 h-10 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'} rounded-full font-bold text-lg`}>
                      2
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-6 w-6 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) ? 'text-green-600' : 'text-gray-400'}`} />
                      <h3 className={`text-xl font-bold ${(selectedChats.length > 0 || csvImportedContacts.length > 0) ? 'text-gray-900' : 'text-gray-500'}`}>
                        الخطوة الثانية: مراجعة المحدد
                      </h3>
                    </div>
                    <div className="flex-1 h-1 bg-green-200 rounded-full mx-4">
                      <div className={`h-full bg-green-500 rounded-full transition-all duration-300 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) ? 'w-full' : 'w-0'}`}></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm space-y-6">
                    {/* NEW: CSV Import Panel */}
                    <CsvImportPanel />

                    {/* Separator */}
                    {csvImportedContacts.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          المحدد من الواتساب
                        </h5>
                      </div>
                    )}

                    {/* EXISTING: Selected Contacts Preview (unchanged) */}
                    <SelectedContactsPreview />
                  </div>
                </div>

                {/* Step 3: Compose and Send (Right Column) */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`flex items-center justify-center w-10 h-10 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-500'} rounded-full font-bold text-lg`}>
                      3
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className={`h-6 w-6 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() ? 'text-orange-600' : 'text-gray-400'}`} />
                      <h3 className={`text-xl font-bold ${(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() ? 'text-gray-900' : 'text-gray-500'}`}>
                        الخطوة الثالثة: إنشاء وإرسال
                      </h3>
                    </div>
                    <div className="flex-1 h-1 bg-orange-200 rounded-full mx-4">
                      <div className={`h-full bg-orange-500 rounded-full transition-all duration-300 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() ? 'w-full' : 'w-0'}`}></div>
                    </div>
                    {(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() && (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <MessageForm
                      message={message}
                      setMessage={setMessage}
                      imageFile={imageFile}
                      setImageFile={setImageFile}
                      delayMin={delayMin}
                      setDelayMin={setDelayMin}
                      delayMax={delayMax}
                      setDelayMax={setDelayMax}
                      onPreview={() => setShowPreview(true)}
                      onSend={sendMessages}
                      onPause={() => setIsPaused(true)}
                      isPaused={isPaused}
                      isRunning={isRunning}
                      loading={loading}
                      disabled={!isConnected || (selectedChats.length === 0 && csvImportedContacts.length === 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Workflow Progress Indicator */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-center gap-8 text-sm">
                  <div className={`flex items-center gap-2 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${(selectedChats.length > 0 || csvImportedContacts.length > 0) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium">
                      تم اختيار {selectedChats.length + csvImportedContacts.length} جهة اتصال
                      {csvImportedContacts.length > 0 && (
                        <span className="text-xs text-blue-600 ml-1">
                          ({selectedChats.length} واتساب + {csvImportedContacts.length} CSV)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 ${message.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${message.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium">تم كتابة الرسالة</span>
                  </div>
                  <div className={`flex items-center gap-2 ${(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-3 h-3 rounded-full ${(selectedChats.length > 0 || csvImportedContacts.length > 0) && message.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium">جاهز للإرسال</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Enhanced Logs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Statistics */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">إحصائيات الحملة</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{log.filter(l => l.success).length}</div>
                    <div className="text-sm text-blue-800">رسائل مرسلة بنجاح</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{log.filter(l => !l.success).length}</div>
                    <div className="text-sm text-red-800">رسائل فاشلة</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-600">{log.length}</div>
                    <div className="text-sm text-gray-800">إجمالي المحاولات</div>
                  </div>
                </div>

                {/* Detailed Logs */}
                <div className="lg:col-span-2">
                  <Logs log={log} allChats={allChats} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        show={showPreview}
        onClose={() => setShowPreview(false)}
        message={message}
        imageFile={imageFile}
      />
    </div>
  );
}
