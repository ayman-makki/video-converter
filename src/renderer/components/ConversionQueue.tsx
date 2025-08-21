import React from 'react';
import { List, Card, Progress, Button, Tag, Space, Typography, Tooltip, Select, Badge } from 'antd';
import { DeleteOutlined, FolderOpenOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { ConversionTask, OutputFormat, QualityLevel } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatFileSize, formatDuration, getStatusColor } from '../utils/formatters';
import './ConversionQueue.css';

const { Text, Title } = Typography;
const { Option } = Select;

interface ConversionQueueProps {
  tasks: ConversionTask[];
  onRemoveTask: (taskId: string) => void;
  onOpenFileLocation: (filePath: string) => void;
}

export const ConversionQueue: React.FC<ConversionQueueProps> = ({
  tasks,
  onRemoveTask,
  onOpenFileLocation
}) => {
  const { updateTaskFormat, updateTaskQuality } = useAppStore();

  const getStatusIcon = (status: ConversionTask['status']) => {
    switch (status) {
      case 'converting':
        return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'paused':
        return <PauseCircleOutlined style={{ color: '#faad14' }} />;
      case 'completed':
        return <Badge status="success" />;
      case 'error':
        return <Badge status="error" />;
      default:
        return <Badge status="default" />;
    }
  };

  const formatSpeed = (speed?: number): string => {
    if (!speed) return '';
    return `${speed.toFixed(1)}x`;
  };

  const renderTaskItem = (task: ConversionTask) => (
    <List.Item key={task.id} className="task-item">
      <Card 
        size="small" 
        className={`task-card task-status-${task.status}`}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div className="task-header">
          <div className="task-info">
            <Space align="start">
              {getStatusIcon(task.status)}
              <div>
                <Text strong className="task-filename">
                  {task.inputFile.split('/').pop() || task.inputFile}
                </Text>
                <br />
                <Text type="secondary" className="task-path">
                  {task.outputFile.split('/').pop() || task.outputFile}
                </Text>
              </div>
            </Space>
          </div>

          <div className="task-actions">
            <Space>
              <Tooltip title="Open file location">
                <Button
                  type="text"
                  icon={<FolderOpenOutlined />}
                  onClick={() => onOpenFileLocation(
                    task.status === 'completed' ? task.outputFile : task.inputFile
                  )}
                />
              </Tooltip>
              
              <Tooltip title="Remove from queue">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveTask(task.id)}
                  disabled={task.status === 'converting'}
                />
              </Tooltip>
            </Space>
          </div>
        </div>

        {/* File information */}
        {task.fileInfo && (
          <div className="task-file-info">
            <Space split={<span className="separator">•</span>}>
              <Text type="secondary">
                {formatFileSize(task.fileInfo.size)}
              </Text>
              <Text type="secondary">
                {formatDuration(task.fileInfo.duration)}
              </Text>
              <Text type="secondary">
                {task.fileInfo.resolution.width}x{task.fileInfo.resolution.height}
              </Text>
              <Text type="secondary">
                {task.fileInfo.format.toUpperCase()}
              </Text>
            </Space>
          </div>
        )}

        {/* Format and quality controls */}
        <div className="task-controls">
          <Space>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Format:</Text>
              <Select
                value={task.outputFormat}
                size="small"
                style={{ width: 80, marginLeft: 8 }}
                onChange={(value: OutputFormat) => updateTaskFormat(task.id, value)}
                disabled={task.status === 'converting' || task.status === 'completed'}
              >
                <Option value="mp3">MP3</Option>
                <Option value="mp4">MP4</Option>
                <Option value="wav">WAV</Option>
                <Option value="aac">AAC</Option>
              </Select>
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Quality:</Text>
              <Select
                value={task.quality}
                size="small"
                style={{ width: 90, marginLeft: 8 }}
                onChange={(value: QualityLevel) => updateTaskQuality(task.id, value)}
                disabled={task.status === 'converting' || task.status === 'completed'}
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="ultra">Ultra</Option>
              </Select>
            </div>
          </Space>
        </div>

        {/* Progress and status */}
        <div className="task-progress">
          {task.status === 'converting' && (
            <>
              <Progress 
                percent={Math.round(task.progress)} 
                size="small" 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div className="progress-details">
                <Space split={<span className="separator">•</span>}>
                  <Text type="secondary">{Math.round(task.progress)}%</Text>
                  {task.speed && (
                    <Text type="secondary">{formatSpeed(task.speed)}</Text>
                  )}
                  {task.eta && (
                    <Text type="secondary">ETA: {task.eta}</Text>
                  )}
                </Space>
              </div>
            </>
          )}

          {task.status === 'completed' && (
            <div className="completion-info">
              <Text type="success">✓ Completed</Text>
              {task.endTime && task.startTime && (
                <Text type="secondary" style={{ marginLeft: 16 }}>
                  {formatDuration((task.endTime - task.startTime) / 1000)}
                </Text>
              )}
            </div>
          )}

          {task.status === 'error' && task.error && (
            <div className="error-info">
              <Text type="danger">✗ Error: {task.error}</Text>
            </div>
          )}

          {task.status === 'paused' && (
            <div className="pause-info">
              <Text type="warning">⏸ Paused at {Math.round(task.progress)}%</Text>
            </div>
          )}

          {(task.status === 'pending' || task.status === 'queued') && (
            <Tag color={getStatusColor(task.status)}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Tag>
          )}
        </div>
      </Card>
    </List.Item>
  );

  const getQueueStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const converting = tasks.filter(t => t.status === 'converting').length;
    const errors = tasks.filter(t => t.status === 'error').length;

    return { total, completed, converting, errors };
  };

  const stats = getQueueStats();

  return (
    <div className="conversion-queue">
      <div className="queue-header">
        <Title level={4}>Conversion Queue</Title>
        <div className="queue-stats">
          <Space>
            <Badge count={stats.total} showZero color="#d9d9d9">
              <Text type="secondary">Total</Text>
            </Badge>
            <Badge count={stats.converting} color="#52c41a">
              <Text type="secondary">Converting</Text>
            </Badge>
            <Badge count={stats.completed} color="#1890ff">
              <Text type="secondary">Completed</Text>
            </Badge>
            {stats.errors > 0 && (
              <Badge count={stats.errors} color="#ff4d4f">
                <Text type="secondary">Errors</Text>
              </Badge>
            )}
          </Space>
        </div>
      </div>

      <div className="queue-content">
        {tasks.length === 0 ? (
          <div className="empty-queue">
            <Text type="secondary">No files in queue</Text>
            <br />
            <Text type="secondary">Add files to start converting</Text>
          </div>
        ) : (
          <List
            dataSource={tasks}
            renderItem={renderTaskItem}
            className="task-list"
          />
        )}
      </div>
    </div>
  );
};