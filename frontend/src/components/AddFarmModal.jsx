import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import ImageUploader from './ImageUploader.jsx';
import MapPicker from './MapPicker.jsx';
import { apiService } from '../services/api.js';

export const AddFarmModal = ({
  isOpen,
  onClose,
  addFarm,
  setSelectedFarm
}) => {
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmCity, setNewFarmCity] = useState('');
  const [newGeocodeError, setNewGeocodeError] = useState(null);
  const [newFarmLat, setNewFarmLat] = useState('');
  const [newFarmLon, setNewFarmLon] = useState('');
  const [showAddFarmMap, setShowAddFarmMap] = useState(false);
  const [newFarmRegion, setNewFarmRegion] = useState('');
  const [newFarmCountry, setNewFarmCountry] = useState('');
  const [newFarmTimezone, setNewFarmTimezone] = useState('');
  const [newFarmCrop, setNewFarmCrop] = useState('Tea');
  const [newFarmImageUrl, setNewFarmImageUrl] = useState(null);
  const [newFarmWind, setNewFarmWind] = useState(20);
  const [newFarmRain, setNewFarmRain] = useState(10);
  const [newFarmEnabled, setNewFarmEnabled] = useState(true);
  const [newFarmNotifyEmail, setNewFarmNotifyEmail] = useState(false);
  const [newFarmEmailAddress, setNewFarmEmailAddress] = useState('');
  const [newFarmNotifySms, setNewFarmNotifySms] = useState(false);
  const [newFarmPhoneNumber, setNewFarmPhoneNumber] = useState('');
  const [newFarmNotifyDiscord, setNewFarmNotifyDiscord] = useState(false);
  const [newFarmDiscordWebhook, setNewFarmDiscordWebhook] = useState('');
  const [newFarmNotifyInApp, setNewFarmNotifyInApp] = useState(true);
  
  const [addingFarm, setAddingFarm] = useState(false);
  const [isResolvingCity, setIsResolvingCity] = useState(false);

  const handleResolveNewFarmCity = async () => {
    if (!newFarmCity.trim()) return;
    setIsResolvingCity(true);
    setNewGeocodeError(null);
    try {
      const data = await apiService.geocodeCity(newFarmCity);
      setNewFarmLat(data.latitude.toString());
      setNewFarmLon(data.longitude.toString());
      setNewFarmRegion(data.region || '');
      setNewFarmCountry(data.country || '');
      setNewFarmTimezone(data.timezone || '');
      setShowAddFarmMap(false);
    } catch (err) {
      setNewGeocodeError(err.response?.data?.error || `Cannot find location: '${newFarmCity}'`);
      setNewFarmLat('');
      setNewFarmLon('');
      setNewFarmRegion('');
      setNewFarmCountry('');
      setNewFarmTimezone('');
    } finally {
      setIsResolvingCity(false);
    }
  };

  const handleAddFarmSubmit = async (e) => {
    e.preventDefault();
    if (!newFarmName || !newFarmLat || !newFarmLon) return;

    setAddingFarm(true);
    try {
      const newFarmObj = await addFarm({
        name: newFarmName,
        latitude: parseFloat(newFarmLat),
        longitude: parseFloat(newFarmLon),
        cropType: newFarmCrop,
        imageUrl: newFarmImageUrl,
        city: newFarmCity,
        windThreshold: parseFloat(newFarmWind),
        rainThreshold: parseFloat(newFarmRain),
        enabled: newFarmEnabled,
        notifyEmail: newFarmNotifyEmail,
        emailAddress: newFarmNotifyEmail ? newFarmEmailAddress : null,
        notifySms: newFarmNotifySms,
        phoneNumber: newFarmNotifySms ? newFarmPhoneNumber : null,
        notifyDiscord: newFarmNotifyDiscord,
        discordWebhook: newFarmNotifyDiscord ? newFarmDiscordWebhook : null,
        notifyInApp: newFarmNotifyInApp,
        region: newFarmRegion,
        country: newFarmCountry,
        timezone: newFarmTimezone
      });
      setSelectedFarm(newFarmObj);
      handleClose();
    } catch (err) {
      alert(`Failed to create farm: ${err.message}`);
    } finally {
      setAddingFarm(false);
    }
  };

  const handleClose = () => {
    // Reset Form
    setNewFarmName('');
    setNewFarmCity('');
    setNewGeocodeError(null);
    setNewFarmLat('');
    setNewFarmLon('');
    setShowAddFarmMap(false);
    setNewFarmRegion('');
    setNewFarmCountry('');
    setNewFarmTimezone('');
    setNewFarmCrop('Tea');
    setNewFarmImageUrl(null);
    setNewFarmWind(20);
    setNewFarmRain(10);
    setNewFarmEnabled(true);
    setNewFarmNotifyEmail(false);
    setNewFarmEmailAddress('');
    setNewFarmNotifySms(false);
    setNewFarmPhoneNumber('');
    setNewFarmNotifyDiscord(false);
    setNewFarmDiscordWebhook('');
    setNewFarmNotifyInApp(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900/90 border border-slate-900 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-in relative terminal-scrollbar">
        
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-all cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Register New Farm Section</h3>
          <p className="text-xs text-slate-500">Configure coordinates and thresholds to get real-time warnings.</p>
        </div>

        <form onSubmit={handleAddFarmSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Farm/Field Name</label>
              <input 
                type="text"
                placeholder="e.g. Bomet Tea Block A"
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">City / Location Name</label>
                {isResolvingCity && <span className="text-[9px] text-emerald-400 animate-pulse font-mono font-bold">RESOLVING...</span>}
              </div>
              <input 
                type="text"
                placeholder="Type city name (e.g. Uttara) and click away to auto-resolve"
                value={newFarmCity}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewFarmCity(val);
                  setNewFarmLat('');
                  setNewFarmLon('');
                  setNewFarmRegion('');
                  setNewFarmCountry('');
                  setNewFarmTimezone('');
                  setNewGeocodeError(null);
                }}
                onBlur={handleResolveNewFarmCity}
                className={`w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 ${newGeocodeError ? 'border-rose-500/40 focus:border-rose-500/60' : ''}`}
              />
              {newGeocodeError && (
                <p className="text-[10px] text-rose-400 font-semibold tracking-wide mt-0.5">{newGeocodeError}</p>
              )}
            </div>

            {newGeocodeError && (
              <>
                <div className="col-span-2 flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interactive Map Picker</span>
                  <button
                    type="button"
                    onClick={() => setShowAddFarmMap(!showAddFarmMap)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-bold hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  >
                    {showAddFarmMap ? 'Hide Map Picker' : 'Show Map Picker'}
                  </button>
                </div>

                {showAddFarmMap && (
                  <div className="col-span-2 py-1">
                    <MapPicker 
                      lat={newFarmLat}
                      lon={newFarmLon}
                      onChange={(lat, lon) => {
                        setNewFarmLat(lat);
                        setNewFarmLon(lon);
                      }}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Latitude</label>
              <input 
                type="number"
                step="0.000001"
                placeholder="e.g. -0.7833"
                value={newFarmLat}
                onChange={(e) => setNewFarmLat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Longitude</label>
              <input 
                type="number"
                step="0.000001"
                placeholder="e.g. 35.3167"
                value={newFarmLon}
                onChange={(e) => setNewFarmLon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Crop/Produce Type</label>
              <select 
                value={newFarmCrop}
                onChange={(e) => setNewFarmCrop(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 bg-slate-950 cursor-pointer"
              >
                <option value="Tea">Tea leaves</option>
                <option value="Maize">Maize field</option>
                <option value="Wheat">Wheat spikes</option>
                <option value="Barley">Barley grain</option>
                <option value="Canola">Canola seed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hourly Scan State</label>
              <select 
                value={newFarmEnabled ? 'active' : 'paused'}
                onChange={(e) => setNewFarmEnabled(e.target.value === 'active')}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 bg-slate-950 cursor-pointer"
              >
                <option value="active">Active Scanning</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Threshold limits settings */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wind Speed Limit (km/h)</label>
              <input 
                type="number"
                step="0.1"
                value={newFarmWind}
                onChange={(e) => setNewFarmWind(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Precipitation Limit (mm)</label>
              <input 
                type="number"
                step="0.1"
                value={newFarmRain}
                onChange={(e) => setNewFarmRain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>
          </div>

          {/* Decoupled alert channels checkboxes */}
          <div className="space-y-3 border-t border-slate-900 pt-4">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dispatch Advisory Warning Channels</span>
            
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="newFarmNotifyInApp"
                  checked={newFarmNotifyInApp}
                  onChange={(e) => setNewFarmNotifyInApp(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                />
                <label htmlFor="newFarmNotifyInApp" className="text-xs text-slate-300 font-medium">Realtime In-App Log Broadcast</label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="newFarmNotifyEmail"
                    checked={newFarmNotifyEmail}
                    onChange={(e) => setNewFarmNotifyEmail(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                  />
                  <label htmlFor="newFarmNotifyEmail" className="text-xs text-slate-300 font-medium">Email Warnings (AWS SMTP)</label>
                </div>
                {newFarmNotifyEmail && (
                  <input 
                    type="email"
                    placeholder="Enter dispatch email address"
                    value={newFarmEmailAddress}
                    onChange={(e) => setNewFarmEmailAddress(e.target.value)}
                    className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="newFarmNotifySms"
                    checked={newFarmNotifySms}
                    onChange={(e) => setNewFarmNotifySms(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                  />
                  <label htmlFor="newFarmNotifySms" className="text-xs text-slate-300 font-medium">SMS Mobile Texts (Twilio API)</label>
                </div>
                {newFarmNotifySms && (
                  <input 
                    type="tel"
                    placeholder="Enter mobile phone number (E.164)"
                    value={newFarmPhoneNumber}
                    onChange={(e) => setNewFarmPhoneNumber(e.target.value)}
                    className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="newFarmNotifyDiscord"
                    checked={newFarmNotifyDiscord}
                    onChange={(e) => setNewFarmNotifyDiscord(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                  />
                  <label htmlFor="newFarmNotifyDiscord" className="text-xs text-slate-300 font-medium">Discord Server Integration</label>
                </div>
                {newFarmNotifyDiscord && (
                  <input 
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={newFarmDiscordWebhook}
                    onChange={(e) => setNewFarmDiscordWebhook(e.target.value)}
                    className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                    required
                  />
                )}
              </div>
            </div>
          </div>

          {/* S3 File Uploader Node */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">S3 Drone Map / Satellite Snap</label>
            <ImageUploader 
              onUploadComplete={(url) => setNewFarmImageUrl(url)}
              currentImageUrl={newFarmImageUrl}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-900 pt-4 mt-2">
            <button 
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={addingFarm}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {addingFarm ? 'Registering...' : 'Register Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFarmModal;
