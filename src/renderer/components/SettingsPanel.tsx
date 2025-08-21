import React, { useState } from 'react';
import { 
  Drawer, 
  Button, 
  Space, 
  Form, 
  Select, 
  Switch, 
  InputNumber, 
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Tooltip,
  Input,
  Tag
} from 'antd';
import { 
  SettingOutlined, 
  FolderOpenOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import { AppSettings, HardwareInfo } from '../types';
import { formatFileSize } from '../utils/formatters';
import { useTranslation } from '../hooks/useTranslation';
import './SettingsPanel.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  hardwareInfo: HardwareInfo | null;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  hardwareInfo
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const showDrawer = () => {
    setVisible(true);
    form.setFieldsValue(settings);
  };

  const onClose = () => {
    setVisible(false);
  };

  const handleFormChange = (changedFields: any, allFields: any) => {
    const newSettings: Partial<AppSettings> = {};
    
    Object.keys(allFields).forEach(key => {
      if (allFields[key] !== undefined) {
        newSettings[key as keyof AppSettings] = allFields[key];
      }
    });

    onSettingsChange(newSettings);
  };

  const handleSelectOutputDirectory = async () => {
    try {
      const directory = await window.electronAPI.selectOutputDirectory();
      if (directory) {
        form.setFieldValue('outputDirectory', directory);
        onSettingsChange({ outputDirectory: directory });
      }
    } catch (error) {
      console.error('Failed to select output directory:', error);
    }
  };

  const renderHardwareInfo = () => {
    if (!hardwareInfo) {
      return (
        <Card size="small">
          <Text type="secondary">{t('settings.system.hardwareNotAvailable')}</Text>
        </Card>
      );
    }

    const { cpu, gpu, memory } = hardwareInfo;

    return (
      <Card size="small" title={t('settings.system.systemInformation')}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>
              <DesktopOutlined /> {t('settings.system.cpu')}:
            </Text>
            <br />
            <Text type="secondary">{cpu.model}</Text>
            <br />
            <Text type="secondary">
              {cpu.cores} {t('settings.system.cores')}, {cpu.threads} {t('settings.system.threads')}
            </Text>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>
              <ThunderboltOutlined /> {t('settings.system.gpuAcceleration')}:
            </Text>
            <br />
            {gpu.nvidia?.available && (
              <Tag color="green">NVIDIA: {gpu.nvidia.model}</Tag>
            )}
            {gpu.amd?.available && (
              <Tag color="red">AMD: {gpu.amd.model}</Tag>
            )}
            {gpu.intel?.available && (
              <Tag color="blue">Intel: {gpu.intel.model}</Tag>
            )}
            {!gpu.nvidia?.available && !gpu.amd?.available && !gpu.intel?.available && (
              <Text type="secondary">{t('settings.system.noGpuAvailable')}</Text>
            )}
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>{t('settings.system.memory')}:</Text>
            <br />
            <Text type="secondary">
              {t('settings.system.total')}: {formatFileSize(memory.total)}
            </Text>
            <br />
            <Text type="secondary">
              {t('settings.system.available')}: {formatFileSize(memory.available)}
            </Text>
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <>
      <Button 
        type="text" 
        icon={<SettingOutlined />} 
        onClick={showDrawer}
        className="settings-button"
      >
        {t('settings.button')}
      </Button>

      <Drawer
        title={t('settings.title')}
        placement="right"
        width={400}
        onClose={onClose}
        open={visible}
        className="settings-drawer"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onValuesChange={handleFormChange}
        >
          <Title level={4}>{t('settings.output.title')}</Title>
          
          <Form.Item
            label={t('settings.output.directory')}
            name="outputDirectory"
            extra={t('settings.output.directoryDescription')}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="outputDirectory" noStyle>
                <Input 
                  placeholder={t('settings.output.directoryPlaceholder')} 
                  readOnly 
                  style={{ flex: 1 }}
                />
              </Form.Item>
              <Button 
                icon={<FolderOpenOutlined />} 
                onClick={handleSelectOutputDirectory}
              >
                {t('settings.output.browse')}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('settings.output.defaultFormat')}
                name="outputFormat"
                extra={t('settings.output.defaultFormatDescription')}
              >
                <Select>
                  <Option value="mp3">MP3</Option>
                  <Option value="mp4">MP4</Option>
                  <Option value="wav">WAV</Option>
                  <Option value="aac">AAC</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('settings.output.defaultQuality')}
                name="audioQuality"
                extra={t('settings.output.defaultQualityDescription')}
              >
                <Select>
                  <Option value="low">{t('settings.quality.low')}</Option>
                  <Option value="medium">{t('settings.quality.medium')}</Option>
                  <Option value="high">{t('settings.quality.high')}</Option>
                  <Option value="ultra">{t('settings.quality.ultra')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={4}>{t('settings.performance.title')}</Title>

          <Form.Item
            label={
              <Space>
                <span>{t('settings.performance.concurrentJobs')}</span>
                <Tooltip title={t('settings.performance.concurrentJobsTooltip')}>
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            name="concurrentJobs"
            extra={t('settings.performance.concurrentJobsDescription')}
          >
            <InputNumber min={1} max={8} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label={t('settings.performance.gpuAcceleration')}
            name="gpuAcceleration"
            valuePropName="checked"
            extra={t('settings.performance.gpuAccelerationDescription')}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t('settings.performance.autoDetectHardware')}
            name="autoDetectHardware"
            valuePropName="checked"
            extra={t('settings.performance.autoDetectHardwareDescription')}
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Title level={4}>{t('settings.general.title')}</Title>

          <Form.Item
            label={t('settings.general.preserveMetadata')}
            name="preserveMetadata"
            valuePropName="checked"
            extra={t('settings.general.preserveMetadataDescription')}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t('settings.general.autoStartConversion')}
            name="autoStartConversion"
            valuePropName="checked"
            extra={t('settings.general.autoStartConversionDescription')}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t('settings.general.notifications')}
            name="notifications"
            valuePropName="checked"
            extra={t('settings.general.notificationsDescription')}
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Title level={4}>{t('settings.system.title')}</Title>
          {renderHardwareInfo()}
        </Form>

        <div className="settings-footer">
          <Space>
            <Button onClick={onClose}>{t('settings.close')}</Button>
            <Button type="primary" onClick={onClose}>
              {t('settings.saveSettings')}
            </Button>
          </Space>
        </div>
      </Drawer>
    </>
  );
};