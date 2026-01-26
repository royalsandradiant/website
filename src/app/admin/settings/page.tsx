import { fetchComboSettings } from '@/app/lib/data';
import ComboSettingsForm from './combo-settings-form';

export default async function SettingsPage() {
  const settings = await fetchComboSettings();

  return (
    <div className="w-full">
      <h1 className="text-2xl mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* Combo Settings */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </span>
            Combo Deal Settings
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure the price for the 3-item combo deal. Customers can select any 3 products marked for combo at this special price.
          </p>
          
          <ComboSettingsForm currentPrice={settings.comboPrice} />
        </div>
      </div>
    </div>
  );
}
