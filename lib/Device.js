'use strict';

const { OAuth2Device } = require('homey-oauth2app');

class Device extends OAuth2Device {

  /*
  | Device events
  */

  // Device added
  async onOAuth2Added() {
    this.log('Added');
  }

  // Device deleted
  async onOAuth2Deleted() {
    // Unregister timer
    this.unregisterTimer();

    this.log('Deleted');
  }

  // Device initialized
  async onOAuth2Init() {
    // Set default data
    this.setDefaults();

    // Register capability listeners
    this.registerCapabilityListeners();

    // Register timer if needed
    this.registerTimer();

    // Synchronize device
    await this.sync();

    this.log('Initialized');
  }

  // Device destroyed
  async onOAuth2Uninit() {
    // Unregister timer
    this.unregisterTimer();

    this.log('Destroyed');
  }

  /*
  | Synchronization functions
  */

  // Synchronize
  async sync() {
    let result;

    try {
      this.log('[Sync] Get last measures from API');

      result = await this.getSyncData();

      await this.handleSyncData(result);

      // Set latest record timestamp
      if (result.timestamp) {
        this.latestRecordTime = result.timestamp;
      }
    } catch (err) {
      this.error('[Sync]', err.toString());
      this.setUnavailable(err.message).catch(this.error);
    } finally {
      result = null;
    }
  }

  /*
  | Timer functions
  */

  // Register timer
  registerTimer() {
    if (this.syncDeviceTimer) return;
    if (!this.constructor.TIMER_INTERVAL) return;

    const interval = 1000 * this.constructor.TIMER_INTERVAL;

    this.syncDeviceTimer = this.homey.setInterval(this.onTimerInterval.bind(this), interval);

    this.log('[Timer] Registered');
  }

  // Unregister timer
  unregisterTimer() {
    if (!this.syncDeviceTimer) return;

    this.homey.clearTimeout(this.syncDeviceTimer);

    this.syncDeviceTimer = null;

    this.log('[Timer] Unregistered');
  }

  /*
  | Listener functions
  */

  // Register capability listeners
  registerCapabilityListeners() {
    if (this.hasCapability('charging_mode')) {
      this.registerCapabilityListener('charging_mode', this.onCapabilityChargingMode.bind(this));
    }

    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    }

    this.log('Capability listeners registered');
  }

  /*
  | Support functions
  */

  // Set default data
  setDefaults() {
    this.updating = null;
    this.latestRecordTime = null;

    this.serviceLocationId = this.getStoreValue('service_location_id');
    this.serviceLocationUuid = this.getStoreValue('service_location_uuid');
  }

}

module.exports = Device;
