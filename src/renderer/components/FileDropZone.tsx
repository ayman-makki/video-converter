import React, { useCallback, useState } from 'react';
import { Upload, Button, Typography, Space, Alert } from 'antd';
import { InboxOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useTranslation } from '../hooks/useTranslation';
import './FileDropZone.css';

const { Dragger } = Upload;
const { Text } = Typography;

interface FileDropZoneProps {
  onFilesSelected: (filePaths: string[]) => void;
  disabled?: boolean;
}

const SUPPORTED_FORMATS = [
  '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v',
  '.3gp', '.ts', '.mts', '.m2ts', '.mp3', '.wav', '.flac', '.aac',
  '.ogg', '.m4a', '.wma'
];

export const FileDropZone: React.FC<FileDropZoneProps> = ({ 
  onFilesSelected, 
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleBrowseFiles = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths.length > 0) {
        onFilesSelected(filePaths);
        setValidationError('');
      }
    } catch (error) {
      console.error('Failed to select files:', error);
      setValidationError(t('fileDropZone.failedToSelect'));
    }
  }, [onFilesSelected]);

  const validateFiles = useCallback((files: FileList | File[]): boolean => {
    const fileArray = Array.from(files);
    const invalidFiles: string[] = [];

    fileArray.forEach((file) => {
      const extension = '.' + file.name.toLowerCase().split('.').pop();
      if (!SUPPORTED_FORMATS.includes(extension)) {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setValidationError(`${t('fileDropZone.unsupportedFormat')}: ${invalidFiles.join(', ')}`);
      return false;
    }

    setValidationError('');
    return true;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    if (validateFiles(files)) {
      const filePaths = Array.from(files).map(file => (file as any).path || file.name);
      onFilesSelected(filePaths);
    }
  }, [disabled, onFilesSelected, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !dragActive) {
      setDragActive(true);
    }
  }, [disabled, dragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragActive) {
      setDragActive(false);
    }
  }, [dragActive]);

  const customRequest = useCallback(({ file, onSuccess }: any) => {
    // Handle file upload through Ant Design's Upload component
    if (validateFiles([file])) {
      onFilesSelected([(file as any).path || file.name]);
    }
    onSuccess(file);
  }, [onFilesSelected, validateFiles]);

  return (
    <div className="file-drop-zone">
      {validationError && (
        <Alert
          message={t('fileDropZone.validationError')}
          description={validationError}
          type="error"
          showIcon
          closable
          onClose={() => setValidationError('')}
          style={{ marginBottom: 16 }}
        />
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`drop-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <Dragger
          name="files"
          multiple
          customRequest={customRequest}
          showUploadList={false}
          disabled={disabled}
          accept={SUPPORTED_FORMATS.join(',')}
          openFileDialogOnClick={false}
        >
        <div className="drop-zone-content">
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: dragActive ? '#1890ff' : '#d9d9d9' }} />
          </p>
          
          <p className="ant-upload-text">
            {disabled 
              ? t('fileDropZone.notReady')
              : t('fileDropZone.dragAndDrop')
            }
          </p>
          
          <p className="ant-upload-hint">
            {!disabled && t('fileDropZone.orClickBelow')}
          </p>

          {!disabled && (
            <Space direction="vertical" size="middle">
              <Button 
                type="primary" 
                icon={<FolderOpenOutlined />}
                size="large"
                onClick={(e) => handleBrowseFiles(e)}
              >
                {t('fileDropZone.browseFiles')}
              </Button>
              
              <Text type="secondary" className="supported-formats">
                {t('fileDropZone.supportedFormats')}
              </Text>
            </Space>
          )}
        </div>
      </Dragger>
      </div>
    </div>
  );
};