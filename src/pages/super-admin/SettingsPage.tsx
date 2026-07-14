import { Settings, Bell, Shield, Globe, Palette } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';

const SETTING_GROUPS = [
  {
    title: 'General',
    icon: Settings,
    items: [
      { label: 'Platform Name', value: 'Dream Jewels', type: 'text' },
      { label: 'Support Email', value: 'support@dreamjewels.com', type: 'text' },
      { label: 'Timezone',      value: 'Asia/Kolkata (IST)', type: 'select' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { label: 'Email Notifications', value: true, type: 'toggle' },
      { label: 'SMS Alerts',          value: false, type: 'toggle' },
      { label: 'In-App Notifications', value: true, type: 'toggle' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { label: 'Two-Factor Auth',  value: false, type: 'toggle' },
      { label: 'Session Timeout', value: '30 minutes', type: 'select' },
    ],
  },
];

export function SettingsPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Settings"
        subtitle="Configure global platform settings."
        className="mb-8"
      />
      <div className="space-y-6 max-w-2xl">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <group.icon size={15} className="text-emerald-600" />
              </div>
              <h2 className="font-semibold text-slate-800">{group.title}</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {group.items.map((item) => (
                <div key={item.label} className="px-6 py-4 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">{item.label}</label>
                  {item.type === 'toggle' ? (
                    <button
                      className={`relative w-10 h-5 rounded-full transition-colors ${item.value ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-5' : ''}`} />
                    </button>
                  ) : (
                    <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      {String(item.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
          Save Settings
        </button>
      </div>
    </PageContainer>
  );
}
