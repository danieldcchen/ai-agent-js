export function processToolCall(toolName, toolInput) {
  if (toolName === 'convert_unit') {
    const result = convertUnit(
      toolInput.value,
      toolInput.from_unit,
      toolInput.to_unit
    );
    return JSON.stringify(result);
  }
  return JSON.stringify({ error: '未知的工具' });
}

export function convertUnit(value, fromUnit, toUnit) {
  // 攝氏 ↔ 華氏
  if (fromUnit === '°C' && toUnit === '°F') {
    const result = (value * 9) / 5 + 32;
    return { success: true, result, unit: '°F' };
  }
  if (fromUnit === '°F' && toUnit === '°C') {
    const result = ((value - 32) * 5) / 9;
    return { success: true, result, unit: '°C' };
  }

  // 公里 ↔ 英里
  if (fromUnit === 'km' && toUnit === 'mile') {
    const result = value * 0.621371;
    return { success: true, result, unit: 'mile' };
  }
  if (fromUnit === 'mile' && toUnit === 'km') {
    const result = value / 0.621371;
    return { success: true, result, unit: 'km' };
  }

  // 公斤 ↔ 磅
  if (fromUnit === 'kg' && toUnit === 'lb') {
    const result = value * 2.20462;
    return { success: true, result, unit: 'lb' };
  }
  if (fromUnit === 'lb' && toUnit === 'kg') {
    const result = value / 2.20462;
    return { success: true, result, unit: 'kg' };
  }

  // 不支援的單位組合
  return {
    success: false,
    error: `不支援 ${fromUnit} 到 ${toUnit} 的換算`,
    supportedConversions: ['°C ↔ °F', 'km ↔ mile', 'kg ↔ lb'],
  };
}
