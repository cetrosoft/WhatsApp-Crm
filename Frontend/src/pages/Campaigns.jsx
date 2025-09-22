import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

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

  // تحميل كل الشاتس من الباك إند
  useEffect(() => {
    fetch("http://localhost:5000/all-chats")
      .then((res) => res.json())
      .then((data) => setAllChats(data))
      .catch((err) => {
        console.error("❌ Error loading chats:", err);
        toast.error("فشل تحميل القوائم");
      });
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
        />
      </div>

      {/* سجل الإرسال */}
      <Logs log={log} allChats={allChats} />

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
