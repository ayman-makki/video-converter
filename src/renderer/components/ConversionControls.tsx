import React from 'react';
import { Button, Space, Typography, Card, Divider } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ClearOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import './ConversionControls.css';

const { Title, Text } = Typography;

interface ConversionControlsProps {
  onStartConversion: () => void;
  onPauseConversion: () => void;
  onCancelConversion: () => void;
  isConverting: boolean;
  hasFiles: boolean;
  disabled?: boolean;
}

export const ConversionControls: React.FC<ConversionControlsProps> = ({
  onStartConversion,
  onPauseConversion,
  onCancelConversion,
  isConverting,
  hasFiles,
  disabled = false
}) => {
  const { t } = useTranslation();
  const { clearQueue, tasks } = useAppStore();

  const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'queued');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const errorTasks = tasks.filter(task => task.status === 'error');

  const handleClearQueue = () => {
    clearQueue();
  };

  return (
    <Card className="conversion-controls" size="small">
      <div className="controls-header">
        <Title level={5}>{t('controls.title')}</Title>
      </div>

      <div className="controls-stats">
        <Space split={<Divider type="vertical" />}>
          <div className="stat-item">
            <Text type="secondary">{t('controls.total')}</Text>
            <br />
            <Text strong>{tasks.length}</Text>
          </div>
          <div className="stat-item">
            <Text type="secondary">{t('controls.pending')}</Text>
            <br />
            <Text strong style={{ color: '#faad14' }}>{pendingTasks.length}</Text>
          </div>
          <div className="stat-item">
            <Text type="secondary">{t('controls.completed')}</Text>
            <br />
            <Text strong style={{ color: '#52c41a' }}>{completedTasks.length}</Text>
          </div>
          {errorTasks.length > 0 && (
            <div className="stat-item">
              <Text type="secondary">{t('controls.errors')}</Text>
              <br />
              <Text strong style={{ color: '#ff4d4f' }}>{errorTasks.length}</Text>
            </div>
          )}
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div className="controls-buttons">
        <Space direction="vertical" style={{ width: '100%' }}>
          {!isConverting ? (
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={onStartConversion}
              disabled={!hasFiles || disabled || pendingTasks.length === 0}
              block
            >
              {t('controls.startConversion')}
            </Button>
          ) : (
            <Button
              type="default"
              size="large"
              icon={<PauseCircleOutlined />}
              onClick={onPauseConversion}
              disabled={disabled}
              block
            >
              {t('controls.pauseConversion')}
            </Button>
          )}

          <Space style={{ width: '100%' }}>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={onCancelConversion}
              disabled={!isConverting || disabled}
              style={{ flex: 1 }}
            >
              {t('controls.cancelAll')}
            </Button>

            <Button
              icon={<ClearOutlined />}
              onClick={handleClearQueue}
              disabled={isConverting || !hasFiles || disabled}
              style={{ flex: 1 }}
            >
              {t('controls.clearQueue')}
            </Button>
          </Space>
        </Space>
      </div>

      {disabled && (
        <div className="controls-disabled-notice">
          <Text type="secondary">
            {t('controls.notReady')}
          </Text>
        </div>
      )}
    </Card>
  );
};