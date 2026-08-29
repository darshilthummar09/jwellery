import { useState } from 'react';
import { Settings, Bell, Shield, Check, Sparkles } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  timezone: string;
  emailNotifications: boolean;
  smsAlerts: boolean;
  inAppNotifications: boolean;
  sessionTimeout: string;
}

const SETTINGS_STORAGE_KEY = 'dream-jewels-platform-settings';

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'Dream Jewels',
  supportEmail: 'support@dreamjewels.com',
  timezone: 'Asia/Kolkata (IST)',
  emailNotifications: true,
  smsAlerts: false,
  inAppNotifications: true,
  sessionTimeout: '30 minutes',
};

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  return (
    <PageContainer>
      <PageTitle
        title="Settings"
        subtitle="Configure global platform settings."
        className="mb-8"
      />

      {savedToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <Check size={16} />
          </div>
          <div>
            <p className="text-sm font-bold">Settings Saved Successfully</p>
            <p className="text-xs text-emerald-600">Your platform preferences have been updated.</p>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Settings size={15} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-800">General</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-400 focus:bg-white text-slate-800 min-w-[240px]"
              />
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-400 focus:bg-white text-slate-800 min-w-[240px]"
              />
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-400 focus:bg-white text-slate-800 cursor-pointer min-w-[240px]"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="Asia/Dubai (GST)">Asia/Dubai (GST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Bell size={15} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-800">Notifications</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 block">Email Notifications</label>
                <span className="text-xs text-slate-400">Receive order status updates via email</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.emailNotifications ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.emailNotifications ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 block">SMS Alerts</label>
                <span className="text-xs text-slate-400">Send instant dispatch SMS to clients</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, smsAlerts: !settings.smsAlerts })}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.smsAlerts ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.smsAlerts ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 block">In-App & Push Notifications</label>
                <span className="text-xs text-slate-400">Show notification bell badge & live push alerts</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, inAppNotifications: !settings.inAppNotifications })}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.inAppNotifications ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.inAppNotifications ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Shield size={15} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-800">Security</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Session Inactivity Timeout</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-400 focus:bg-white text-slate-800 cursor-pointer min-w-[240px]"
              >
                <option value="15 minutes">15 minutes</option>
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="24 hours">24 hours</option>
                <option value="Never">Never (Persistent Session)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-[0.98] cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </PageContainer>
  );
}
