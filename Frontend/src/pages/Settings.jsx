import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { User, Phone, MessageCircle, Settings as SettingsIcon, Wifi } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "profile", label: "إدارة الملف الشخصي", icon: User },
    { id: "settings", label: "إعدادات عامة", icon: SettingsIcon }
  ];

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/profile");
      const data = await response.json();
      if (data.success) {
        setProfileData(data.profile);
        setIsConnected(data.connected);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("فشل في تحميل بيانات الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  // Connect to WhatsApp
  const connectToWhatsApp = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/connect", {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        toast.success("تم بدء الاتصال بواتساب");
        // Refresh profile data after connection
        setTimeout(fetchProfile, 2000);
      } else {
        toast.error(data.message || "فشل في الاتصال");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from WhatsApp
  const disconnectFromWhatsApp = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/disconnect", {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        toast.success("تم قطع الاتصال");
        setProfileData(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("خطأ في قطع الاتصال");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          حالة الاتصال
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? "متصل بواتساب" : "غير متصل"}
            </span>
          </div>

          <div className="flex gap-2">
            {!isConnected ? (
              <button
                onClick={connectToWhatsApp}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                اتصال
              </button>
            ) : (
              <button
                onClick={disconnectFromWhatsApp}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قطع الاتصال
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      {profileData && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الملف الشخصي
          </h3>

          <div className="space-y-4">
            {/* Profile Picture */}
            {profileData.profilePic && (
              <div className="flex items-center gap-4">
                <img
                  src={profileData.profilePic}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="font-medium">صورة الملف الشخصي</p>
                  <p className="text-sm text-gray-500">متصل بواتساب</p>
                </div>
              </div>
            )}

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="font-medium">{profileData.name || "غير محدد"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="font-medium">{profileData.number || "غير محدد"}</p>
                </div>
              </div>

              {profileData.about && (
                <div className="md:col-span-2 flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">نبذة شخصية</p>
                    <p className="font-medium">{profileData.about}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <div className="pt-4 border-t">
              <button
                onClick={fetchProfile}
                disabled={loading || !isConnected}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تحديث البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Profile Message */}
      {!profileData && !loading && (
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات ملف شخصي</h3>
          <p className="text-gray-500 mb-4">
            يرجى الاتصال بواتساب أولاً لعرض بيانات الملف الشخصي
          </p>
          {!isConnected && (
            <button
              onClick={connectToWhatsApp}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              اتصال بواتساب
            </button>
          )}
        </div>
      )}
    </div>
  );

  const GeneralSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">الإعدادات العامة</h3>
        <p className="text-gray-500">إعدادات عامة للتطبيق - قريباً</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">⚙️ الإعدادات</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" dir="rtl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "settings" && <GeneralSettingsTab />}
        </>
      )}
    </div>
  );
}
