import React from 'react';
import { Layout, Typography, Space, Badge, Tooltip, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  DesktopOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';
import { HardwareInfo } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import './HeaderBar.css';

const { Header } = Layout;
const { Title, Text } = Typography;

interface HeaderBarProps {
  hardwareInfo: HardwareInfo | null;
  servicesReady: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ hardwareInfo, servicesReady }) => {
  const { t } = useTranslation();
  const getGPUStatus = () => {
    if (!hardwareInfo) return null;
    
    const { nvidia, amd, intel } = hardwareInfo.gpu;
    
    if (nvidia?.available) {
      return { type: 'NVIDIA', color: '#76b900' };
    } else if (amd?.available) {
      return { type: 'AMD', color: '#ed1c24' };
    } else if (intel?.available) {
      return { type: 'Intel', color: '#0071c5' };
    }
    
    return null;
  };

  const gpuStatus = getGPUStatus();

  return (
    <Header className="header-bar">
      <div className="header-content">
        <div className="header-left">
          <Space align="center">
            <ThunderboltOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              {t('header.title')}
            </Title>
          </Space>
        </div>

        <div className="header-right">
          <Space size="large">
            {/* Service Status */}
            <Tooltip title={servicesReady ? t('header.services.ready') : t('header.services.notReady')}>
              <Badge 
                status={servicesReady ? 'success' : 'processing'} 
                text={
                  <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    {servicesReady ? t('header.services.ready') : t('header.services.notReady')}
                  </Text>
                }
              />
            </Tooltip>

            {/* Hardware Info */}
            {hardwareInfo && (
              <Space>
                <Tooltip title={`${t('header.hardware.cpu')}: ${hardwareInfo.cpu.model} (${hardwareInfo.cpu.cores} ${t('settings.system.cores')})`}>
                  <Tag icon={<DesktopOutlined />} color="blue">
                    {hardwareInfo.cpu.cores} {t('settings.system.cores')}
                  </Tag>
                </Tooltip>

                {gpuStatus && (
                  <Tooltip title={`${t('settings.system.gpuAcceleration')}: ${gpuStatus.type}`}>
                    <Tag icon={<ThunderboltOutlined />} color="green">
                      {gpuStatus.type} GPU
                    </Tag>
                  </Tooltip>
                )}
              </Space>
            )}

            {/* FFmpeg Status */}
            <Tooltip title="Moteur de traitement FFmpeg">
              {servicesReady ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
              )}
            </Tooltip>
          </Space>
        </div>
      </div>
    </Header>
  );
};