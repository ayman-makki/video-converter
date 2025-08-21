import React from 'react';
import { Card, Progress, Typography, Space } from 'antd';
import { ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from '../hooks/useTranslation';
import './ProgressDisplay.css';

const { Title, Text } = Typography;

interface ProgressDisplayProps {
  progress: number;
  isConverting: boolean;
  speed?: number;
  eta?: string;
  currentTask?: string;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progress,
  isConverting,
  speed,
  eta,
  currentTask
}) => {
  const { t } = useTranslation();
  
  const getProgressStatus = () => {
    if (!isConverting) return 'normal';
    if (progress >= 100) return 'success';
    if (progress > 0) return 'active';
    return 'normal';
  };

  const getProgressColor = () => {
    if (progress >= 100) return '#52c41a';
    if (progress >= 75) return '#1890ff';
    if (progress >= 50) return '#faad14';
    return '#d9d9d9';
  };

  return (
    <Card className="progress-display" size="small">
      <div className="progress-header">
        <Title level={5}>{t('progress.overall')}</Title>
        {isConverting && (
          <Text type="secondary" className="progress-status">
            {t('progress.converting')}
          </Text>
        )}
      </div>

      <div className="progress-content">
        <Progress
          type="circle"
          percent={Math.round(progress)}
          size={120}
          status={getProgressStatus()}
          strokeColor={getProgressColor()}
          strokeWidth={8}
          format={(percent) => (
            <div className="progress-center">
              <div className="progress-percent">
                {percent}%
              </div>
              {isConverting && (
                <div className="progress-label">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('progress.converting')}
                  </Text>
                </div>
              )}
            </div>
          )}
        />
      </div>

      {isConverting && (progress > 0 || speed || eta) && (
        <div className="progress-details">
          <Space direction="vertical" style={{ width: '100%' }}>
            {speed && (
              <div className="progress-metric">
                <Space>
                  <ThunderboltOutlined />
                  <Text type="secondary">{t('progress.speed')}:</Text>
                  <Text strong>{speed.toFixed(1)}x</Text>
                </Space>
              </div>
            )}
            
            {eta && (
              <div className="progress-metric">
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary">{t('progress.timeRemaining')}:</Text>
                  <Text strong>{eta}</Text>
                </Space>
              </div>
            )}

            {currentTask && (
              <div className="current-task">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Actuel: {currentTask}
                </Text>
              </div>
            )}
          </Space>
        </div>
      )}

      {!isConverting && progress === 0 && (
        <div className="progress-idle">
          <Text type="secondary">
            {t('progress.idle')}
          </Text>
        </div>
      )}

      {!isConverting && progress > 0 && (
        <div className="progress-completed">
          <Text type="success">
            {t('progress.completed')}
          </Text>
        </div>
      )}
    </Card>
  );
};