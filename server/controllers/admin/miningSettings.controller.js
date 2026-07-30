const SystemSetting = require('../../models/SystemSetting');

const DEFAULT_SETTINGS = {
  timerDuration: 24, // in hours
  isPaused: false,
  isDisabled: false,
};

exports.getMiningSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'mining_settings' });
    if (!settings) {
      settings = await SystemSetting.create({
        key: 'mining_settings',
        value: DEFAULT_SETTINGS,
        description: 'Global configuration for the mining timer, pause state, and visibility.',
      });
    }

    res.status(200).json({
      success: true,
      data: settings.value,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMiningSettings = async (req, res, next) => {
  try {
    const { timerDuration, isPaused, isDisabled } = req.body;
    
    // Validate timerDuration
    const duration = parseInt(timerDuration);
    if (isNaN(duration) || duration < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Timer duration must be a positive integer.' },
      });
    }

    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'mining_settings' },
      {
        value: {
          timerDuration: duration,
          isPaused: !!isPaused,
          isDisabled: !!isDisabled,
        },
      },
      { new: true, upsert: true }
    );

    const { emitGlobalMiningSettingsUpdate } = require('../../utils/dashboardEvents');
    emitGlobalMiningSettingsUpdate(req.app, settings.value);

    res.status(200).json({
      success: true,
      message: 'Mining settings updated successfully.',
      data: settings.value,
    });
  } catch (error) {
    next(error);
  }
};
