import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { User, Wifi, AlertCircle } from "lucide-react";

import MessageForm from "../components/MessageForm";
import ContactsList from "../components/ContactsList";
import Logs from "../components/Logs";
import PreviewModal from "../components/PreviewModal";

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

  // إرسال الرسائل (مع Pause/Resume)
  const sendMessages = async () => {
    if (!isConnected) {
      toast.error("يرجى الاتصال بواتساب أولاً!");
      return;
    }

    if (selectedChats.length === 0) {
      toast.error("اختر الأفراد أو الجروبات أولاً!");
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setLoading(true);

    for (let i = currentIndex; i < selectedChats.length; i++) {
      if (isPaused) {
        setCurrentIndex(i); // نحفظ مكان التوقف
        toast("⏸️ تم إيقاف الإرسال مؤقتًا");
        setLoading(false);
        return;
      }

      const id = selectedChats[i];
      const chat = allChats.find((c) => c.id === id);

      // إعداد البيانات
      const formData = new FormData();
      formData.append("message", message);
      formData.append("delayMin", delayMin);
      formData.append("delayMax", delayMax);
      if (imageFile) formData.append("image", imageFile);
      if (chat.isGroup) {
        formData.append("groups[]", id);
      } else {
        formData.append("numbers[]", id);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الفورم + لست الكونتاكتس */}
        <div className="space-y-6">
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
            disabled={!isConnected}
          />

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

        {/* سجل الإرسال */}
        <Logs log={log} allChats={allChats} />
      </div>

      {/* نافذة المعاينة */}
      <PreviewModal
        show={showPreview}
        onClose={() => setShowPreview(false)}
        message={message}
        imageFile={imageFile}
      />
    </div>
  );
}
