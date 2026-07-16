import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import ImageUploader from './ImageUploader.jsx';
import MapPicker from './MapPicker.jsx';
import { apiService } from '../services/api.js';

export const EditFarmModal = ({
  isOpen,
  onClose,
  farm,
  updateFarm,
  setSelectedFarm
}) => {
  const [editFarmName, setEditFarmName] = useState('');
  const [editFarmCity, setEditFarmCity] = useState('');
  const [editGeocodeError, setEditGeocodeError] = useState(null);
  const [editFarmLat, setEditFarmLat] = useState('');
  const [editFarmLon, setEditFarmLon] = useState('');
  const [showEditFarmMap, setShowEditFarmMap] = useState(false);
  const [editFarmRegion, setEditFarmRegion] = useState('');
  const [editFarmCountry, setEditFarmCountry] = useState('');
  const [editFarmTimezone, setEditFarmTimezone] = useState('');
  const [editFarmCrop, setEditFarmCrop] = useState('Tea');
  const [editFarmImageUrl, setEditFarmImageUrl] = useState(null);
  const [editFarmWind, setEditFarmWind] = useState(20);
  const [editFarmRain, setEditFarmRain] = useState(10);
  const [editFarmEnabled, setEditFarmEnabled] = useState(true);
  const [editFarmNotifyEmail, setEditFarmNotifyEmail] = useState(false);
  const [editFarmEmailAddress, setEditFarmEmailAddress] = useState('');
  const [editFarmNotifySms, setEditFarmNotifySms] = useState(false);
  const [editFarmPhoneNumber, setEditFarmPhoneNumber] = useState('');
  const [editFarmNotifyDiscord, setEditFarmNotifyDiscord] = useState(false);
  const [editFarmDiscordWebhook, setEditFarmDiscordWebhook] = useState('');
  const [editFarmNotifyInApp, setEditFarmNotifyInApp] = useState(true);

  const [updatingFarm, setUpdatingFarm] = useState(false);
  const [isResolvingEditCity, setIsResolvingEditCity] = useState(false);

  useEffect(() => {
    if (farm) {
      const config = farm.alertConfig || {
        windThreshold: 20,
        rainThreshold: 10,
        enabled: true,
        notifyEmail: false,
        emailAddress: '',
        notifySms: false,
        phoneNumber: '',
        notifyDiscord: false,
        discordWebhook: '',
        notifyInApp: true
      };
      setEditFarmName(farm.name);
      setEditFarmCity(farm.city || '');
      setEditGeocodeError(null);
      setEditFarmLat(farm.latitude.toString());
      setEditFarmLon(farm.longitude.toString());
      setEditFarmRegion(farm.region || '');
      setEditFarmCountry(farm.country || '');
      setEditFarmTimezone(farm.timezone || '');
      setEditFarmCrop(farm.cropType);
      setEditFarmImageUrl(farm.imageUrl);
      setEditFarmWind(config.windThreshold);
      setEditFarmRain(config.rainThreshold);
      setEditFarmEnabled(config.enabled);
      setEditFarmNotifyEmail(config.notifyEmail);
      setEditFarmEmailAddress(config.emailAddress || '');
      setEditFarmNotifySms(config.notifySms);
      setEditFarmPhoneNumber(config.phoneNumber || '');
      setEditFarmNotifyDiscord(config.notifyDiscord);
      setEditFarmDiscordWebhook(config.discordWebhook || '');
      setEditFarmNotifyInApp(config.notifyInApp);
      setShowEditFarmMap(false);
    }
  }, [farm, isOpen]);

  const handleResolveEditFarmCity = async () => {
    if (!editFarmCity.trim()) return;
    setIsResolvingEditCity(true);
    setEditGeocodeError(null);
    try {
      const data = await apiService.geocodeCity(editFarmCity);
      setEditFarmLat(data.latitude.toString());
      setEditFarmLon(data.longitude.toString());
      setEditFarmRegion(data.region || '');
      setEditFarmCountry(data.country || '');
      setEditFarmTimezone(data.timezone || '');
      setShowEditFarmMap(false);
    } catch (err) {
      setEditGeocodeError(err.response?.data?.error || `Cannot find location: '${editFarmCity}'`);
      setEditFarmLat('');
      setEditFarmLon('');
      setEditFarmRegion('');
      setEditFarmCountry('');
      setEditFarmTimezone('');
    } finally {
      setIsResolvingEditCity(false);
    }
  };

  const handleEditFarmSubmit = async (e) => {
    e.preventDefault();
    if (!editFarmName || !editFarmLat || !editFarmLon) return;

    setUpdatingFarm(true);
    try {
      const updated = await updateFarm(farm.id, {
        name: editFarmName,
        latitude: parseFloat(editFarmLat),
        longitude: parseFloat(editFarmLon),
        cropType: editFarmCrop,
        imageUrl: editFarmImageUrl,
        city: editFarmCity,
        windThreshold: parseFloat(editFarmWind),
        rainThreshold: parseFloat(editFarmRain),
        enabled: editFarmEnabled,
        notifyEmail: editFarmNotifyEmail,
        emailAddress: editFarmNotifyEmail ? editFarmEmailAddress : null,
        notifySms: editFarmNotifySms,
        phoneNumber: editFarmNotifySms ? editFarmPhoneNumber : null,
        notifyDiscord: editFarmNotifyDiscord,
        discordWebhook: editFarmNotifyDiscord ? editFarmDiscordWebhook : null,
        notifyInApp: editFarmNotifyInApp,
        region: editFarmRegion,
        country: editFarmCountry,
        timezone: editFarmTimezone
      });
      setSelectedFarm(updated);
      handleClose();
    } catch (err) {
      alert(`Failed to update farm: ${err.message}`);
    } finally {
      setUpdatingFarm(false);
    }
  };

  const handleClose = () => {
    setShowEditFarmMap(false);
    onClose();
  };

  if (!isOpen || !farm) return null;

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
          <h3 className="text-lg font-bold text-white">Edit Farm Details</h3>
          <p className="text-xs text-slate-500">Update coordinates, thresholds, or details for your farm.</p>
        </div>

        <form onSubmit={handleEditFarmSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Farm/Field Name</label>
              <input 
                type="text"
                value={editFarmName}
                onChange={(e) => setEditFarmName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">City / Location Name</label>
                {isResolvingEditCity && <span className="text-[9px] text-emerald-400 animate-pulse font-mono font-bold">RESOLVING...</span>}
              </div>
              <input 
                type="text"
                placeholder="Type city name to update coordinates"
                value={editFarmCity}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditFarmCity(val);
                  setEditFarmLat('');
                  setEditFarmLon('');
                  setEditFarmRegion('');
                  setEditFarmCountry('');
                  setEditFarmTimezone('');
                  setEditGeocodeError(null);
                }}
                onBlur={handleResolveEditFarmCity}
                className={`w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 ${editGeocodeError ? 'border-rose-500/40 focus:border-rose-500/60' : ''}`}
              />
              {editGeocodeError && (
                <p className="text-[10px] text-rose-400 font-semibold tracking-wide mt-0.5">{editGeocodeError}</p>
              )}
            </div>

            {editGeocodeError && (
              <>
                <div className="col-span-2 flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interactive Map Picker</span>
                  <button
                    type="button"
                    onClick={() => setShowEditFarmMap(!showEditFarmMap)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-bold hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  >
                    {showEditFarmMap ? 'Hide Map Picker' : 'Show Map Picker'}
                  </button>
                </div>

                {showEditFarmMap && (
                  <div className="col-span-2 py-1">
                    <MapPicker 
                      lat={editFarmLat}
                      lon={editFarmLon}
                      onChange={(lat, lon) => {
                        setEditFarmLat(lat);
                        setEditFarmLon(lon);
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
                value={editFarmLat}
                onChange={(e) => setEditFarmLat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Longitude</label>
              <input 
                type="number"
                step="0.000001"
                value={editFarmLon}
                onChange={(e) => setEditFarmLon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Crop/Produce Type</label>
              <select 
                value={editFarmCrop}
                onChange={(e) => setEditFarmCrop(e.target.value)}
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
                value={editFarmEnabled ? 'active' : 'paused'}
                onChange={(e) => setEditFarmEnabled(e.target.value === 'active')}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 bg-slate-950 cursor-pointer"
              >
                <option value="active">Active Scanning</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wind Speed Limit (km/h)</label>
              <input 
                type="number"
                step="0.1"
                value={editFarmWind}
                onChange={(e) => setEditFarmWind(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Precipitation Limit (mm)</label>
              <input 
                type="number"
                step="0.1"
                value={editFarmRain}
                onChange={(e) => setEditFarmRain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                required
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-900 pt-4">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dispatch Advisory Warning Channels</span>
            
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="editFarmNotifyInApp"
                  checked={editFarmNotifyInApp}
                  onChange={(e) => setEditFarmNotifyInApp(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                />
                <label htmlFor="editFarmNotifyInApp" className="text-xs text-slate-300 font-medium">Realtime In-App Log Broadcast</label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="editFarmNotifyEmail"
                    checked={editFarmNotifyEmail}
                    onChange={(e) => setEditFarmNotifyEmail(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                  />
                  <label htmlFor="editFarmNotifyEmail" className="text-xs text-slate-300 font-medium">Email Warnings (AWS SMTP)</label>
                </div>
                {editFarmNotifyEmail && (
                  <input 
                    type="email"
                    placeholder="Enter dispatch email address"
                    value={editFarmEmailAddress}
                    onChange={(e) => setEditFarmEmailAddress(e.target.value)}
                    className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="editFarmNotifySms"
                    checked={editFarmNotifySms}
                    onChange={(e) => setEditFarmNotifySms(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                  />
                  <label htmlFor="editFarmNotifySms" className="text-xs text-slate-300 font-medium">SMS Mobile Texts (Twilio API)</label>
                </div>
                {editFarmNotifySms && (
                  <input 
                    type="tel"
                    placeholder="Enter mobile phone number"
                    value={editFarmPhoneNumber}
                    onChange={(e) => setEditFarmPhoneNumber(e.target.value)}
                    className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="editFarmNotifyDiscord"
                    checked={editFarmNotifyDiscord}
                    onChange={(e) => setEditFarmNotifyDiscord(e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                  />
                  <label htmlFor="editFarmNotifyDiscord" className="text-xs text-slate-300 font-medium">Discord Server Integration</label>
                </div>
                {editFarmNotifyDiscord && (
                  <input 
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={editFarmDiscordWebhook}
                    onChange={(e) => setEditFarmDiscordWebhook(e.target.value)}
                    className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                    required
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">S3 Drone Map / Satellite Snap</label>
            <ImageUploader 
              onUploadComplete={(url) => setEditFarmImageUrl(url)}
              currentImageUrl={editFarmImageUrl}
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
              disabled={updatingFarm}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {updatingFarm ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFarmModal;
