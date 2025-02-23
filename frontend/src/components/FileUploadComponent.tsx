"use client";
import { UploadOutlined } from "@ant-design/icons";
import {
    Alert,
    Button,
    Card,
    List,
    Modal,
    Progress,
    Typography,
    Upload,
    message,
} from "antd";
import { RcFile } from "antd/lib/upload";
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import React, { useEffect, useState } from "react";

interface ProgressUpdate {
    fileIndex: number;
    processingProgress?: number;
    processingComplete?: boolean;
    error?: string;
}

interface CustomUploadFile extends UploadFile {
    uploadProgress?: number;
    processProgress?: number;
    uploadStartTime?: number;
    uploadEndTime?: number;
    processingStartTime?: number;
    processingEndTime?: number;
}

const FileUploadComponent: React.FC = () => {
    const [visible, setVisible] = useState<boolean>(false);
    const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);

    // Function to handle the file selection
    const handleChange = (info: UploadChangeParam<CustomUploadFile>): void => {
        setFileList(
            info.fileList.map((fileObj) => ({
                ...fileObj,
                uploadProgress: 0,
                processProgress: 0,
                uploadStartTime: undefined,
                uploadEndTime: undefined,
                processingStartTime: undefined,
                processingEndTime: undefined,
            }))
        );
    };

    useEffect(() => {
        // Check if all files are completed
        const allProcessingComplete = fileList.every(
            (f) => f.processProgress === 100
        );

        if (allProcessingComplete && uploading) {
            setUploading(false);
        }
    }, [fileList, uploading]);

    const handleUpload = (): void => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        fileList.forEach((fileObj) => {
            const originFileObj = fileObj.originFileObj as RcFile;
            if (originFileObj) {
                formData.append("files", originFileObj);
            }
        });

        setUploading(true);

        // Track upload progress
        // @ts-ignore
        xhr.upload.onprogress = (
            event: ProgressEvent<XMLHttpRequestEventTarget>
        ): void => {
            if (event.lengthComputable) {
                const total = event.total;
                const loaded = event.loaded;
                const uploadProgress = (loaded / total) * 100;

                // Update upload progress for all files
                setFileList((prevFileList) =>
                    prevFileList.map((fObj) => {
                        // Set upload start time if not already set
                        if (!fObj.uploadStartTime) {
                            fObj.uploadStartTime = Date.now();
                        }
                        // Set upload end time when upload completes
                        if (uploadProgress === 100 && !fObj.uploadEndTime) {
                            fObj.uploadEndTime = Date.now();
                        }
                        return { ...fObj, uploadProgress };
                    })
                );
            }
        };

        // Track processing progress
        let lastIndex = 0;

        // Handle streaming response
        xhr.onprogress = (): void => {
            // Process new data as it arrives
            const responseText = xhr.responseText;
            const newText = responseText.substring(lastIndex);
            lastIndex = responseText.length;
            const lines = newText.split("\n");

            setFileList((prevFileList) => {
                let newFileList = [...prevFileList];

                lines.forEach((line) => {
                    if (line.trim() !== "") {
                        try {
                            const json: ProgressUpdate = JSON.parse(line);
                            const {
                                fileIndex,
                                processingProgress,
                                processingComplete,
                            } = json;

                            newFileList = newFileList.map((fObj, idx) => {
                                if (idx === fileIndex) {
                                    if (!fObj.processingStartTime) {
                                        fObj.processingStartTime = Date.now();
                                    }
                                    if (
                                        processingComplete &&
                                        !fObj.processingEndTime
                                    ) {
                                        fObj.processingEndTime = Date.now();
                                    }
                                    return {
                                        ...fObj,
                                        processProgress:
                                            processingProgress || 100,
                                    };
                                }
                                return fObj;
                            });
                        } catch (e) {
                            console.error("Error parsing line:", line, e);
                        }
                    }
                });

                return newFileList;
            });
        };

        // Handle request completion
        xhr.onreadystatechange = (): void => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Request completed successfully
                    // If there is any additional final processing needed, do it here
                } else {
                    // HTTP error occurred
                    setUploading(false);
                    message.error(
                        `Upload failed with status ${xhr.status}: ${xhr.statusText}`
                    );
                }
            }
        };

        xhr.onerror = (): void => {
            setUploading(false);
            message.error("Network error occurred during upload.");
        };

        xhr.open("POST", "/api/grades/upload");
        xhr.send(formData);
    };

    // Function to format time durations
    const formatDuration = (start?: number, end?: number): string => {
        if (start && end) {
            const duration = end - start; // duration in milliseconds
            const seconds = (duration / 1000).toFixed(2);
            return `${seconds} seconds`;
        }
        return "N/A";
    };

    // Handle modal close attempt
    const handleModalClose = (): void => {
        if (uploading) {
            message.warning(
                "Please wait until all uploads and processing are finished before closing the modal."
            );
        } else {
            // Resetting state when modal is closed
            setVisible(false);
            setFileList([]);
        }
    };

    // Calculate overall metrics
    const uploadStartTimes = fileList
        .map((file) => file.uploadStartTime)
        .filter((time): time is number => !!time);

    const uploadEndTimes = fileList
        .map((file) => file.uploadEndTime)
        .filter((time): time is number => !!time);

    const processingStartTimes = fileList
        .map((file) => file.processingStartTime)
        .filter((time): time is number => !!time);

    const processingEndTimes = fileList
        .map((file) => file.processingEndTime)
        .filter((time): time is number => !!time);

    // Overall start and end times
    const overallStartTime =
        uploadStartTimes.length > 0 ? Math.min(...uploadStartTimes) : undefined;

    const overallEndTime =
        processingEndTimes.length > 0
            ? Math.max(...processingEndTimes)
            : undefined;

    // Total overall time
    const totalOverallTime =
        overallStartTime !== undefined && overallEndTime !== undefined
            ? overallEndTime - overallStartTime
            : 0;

    // Total upload time (from earliest upload start to latest upload end)
    const totalUploadTime =
        uploadStartTimes.length > 0 && uploadEndTimes.length > 0
            ? Math.max(...uploadEndTimes) - Math.min(...uploadStartTimes)
            : 0;

    // Total processing time (from earliest processing start to latest processing end)
    const totalProcessingTime =
        processingStartTimes.length > 0 && processingEndTimes.length > 0
            ? Math.max(...processingEndTimes) -
              Math.min(...processingStartTimes)
            : 0;

    // Format overall times
    const formattedTotalUploadTime =
        totalUploadTime > 0
            ? `${(totalUploadTime / 1000).toFixed(2)} seconds`
            : "N/A";
    const formattedTotalProcessingTime =
        totalProcessingTime > 0
            ? `${(totalProcessingTime / 1000).toFixed(2)} seconds`
            : "N/A";
    const formattedTotalOverallTime =
        totalOverallTime > 0
            ? `${(totalOverallTime / 1000).toFixed(2)} seconds`
            : "N/A";

    return (
        <>
            <Button type="primary" onClick={() => setVisible(true)}>
                Upload CSV Files
            </Button>
            <Modal
                title="Upload CSV Files"
                visible={visible}
                onCancel={handleModalClose}
                footer={
                    <Button
                        key="close"
                        onClick={handleModalClose}
                        disabled={uploading}
                    >
                        Close
                    </Button>
                }
                maskClosable={!uploading}
                keyboard={!uploading}
            >
                <Card>
                    <Upload
                        multiple
                        beforeUpload={() => false} // Prevent automatic upload
                        fileList={fileList}
                        onChange={handleChange}
                        disabled={uploading}
                    >
                        <Button icon={<UploadOutlined />} disabled={uploading}>
                            Select Files
                        </Button>
                    </Upload>
                    <Button
                        type="primary"
                        onClick={handleUpload}
                        disabled={fileList.length === 0 || uploading}
                        loading={uploading}
                        style={{ marginTop: "16px" }}
                    >
                        {uploading ? "Uploading" : "Start Import"}
                    </Button>
                    {uploading && (
                        <Alert
                            message="Please do not close the browser window while the upload is in progress."
                            type="info"
                            showIcon
                            style={{ marginTop: "16px" }}
                        />
                    )}
                    <List
                        itemLayout="horizontal"
                        dataSource={fileList}
                        renderItem={(fileObj, idx) => (
                            <List.Item key={fileObj.uid}>
                                <List.Item.Meta
                                    title={
                                        <Typography.Text>
                                            {fileObj.name}
                                        </Typography.Text>
                                    }
                                    description={
                                        uploading || fileObj.uploadEndTime ? (
                                            <>
                                                <div>
                                                    {uploading && (
                                                        <>
                                                            {fileObj.uploadProgress !==
                                                                undefined && (
                                                                <>
                                                                    Upload
                                                                    Progress:{" "}
                                                                    {(fileObj.uploadProgress?.toFixed(
                                                                        2
                                                                    ) ||
                                                                        "0.00") +
                                                                        "%"}
                                                                    <Progress
                                                                        percent={
                                                                            toFixedNumber(
                                                                                fileObj.uploadProgress,
                                                                                2
                                                                            ) ||
                                                                            0
                                                                        }
                                                                        status={
                                                                            fileObj.uploadProgress ===
                                                                            100
                                                                                ? "success"
                                                                                : "active"
                                                                        }
                                                                    />
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    {fileObj.uploadEndTime && (
                                                        <p>
                                                            Upload Time:{" "}
                                                            {formatDuration(
                                                                fileObj.uploadStartTime,
                                                                fileObj.uploadEndTime
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    {uploading && (
                                                        <>
                                                            {fileObj.processProgress !==
                                                                undefined && (
                                                                <>
                                                                    Processing
                                                                    Progress:{" "}
                                                                    {(fileObj.processProgress?.toFixed(
                                                                        2
                                                                    ) || 0) +
                                                                        "%"}
                                                                    <Progress
                                                                        percent={
                                                                            fileObj.processProgress ||
                                                                            0
                                                                        }
                                                                        status={
                                                                            fileObj.processProgress ===
                                                                            100
                                                                                ? "success"
                                                                                : "active"
                                                                        }
                                                                    />
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    {fileObj.processingEndTime && (
                                                        <p>
                                                            Processing Time:{" "}
                                                            {formatDuration(
                                                                fileObj.processingStartTime,
                                                                fileObj.processingEndTime
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                {fileObj.uploadEndTime &&
                                                    fileObj.processingEndTime && (
                                                        <div>
                                                            <p>
                                                                Total Time:{" "}
                                                                {formatDuration(
                                                                    fileObj.uploadStartTime,
                                                                    fileObj.processingEndTime
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                            </>
                                        ) : null
                                    }
                                />
                            </List.Item>
                        )}
                        style={{ marginTop: "16px" }}
                    />
                    {/* Overall Metrics */}
                    {totalOverallTime > 0 && (
                        <div style={{ marginTop: "16px" }}>
                            <h3>Overall Metrics:</h3>
                            <p>Total Upload Time: {formattedTotalUploadTime}</p>
                            <p>
                                Total Processing Time:{" "}
                                {formattedTotalProcessingTime}
                            </p>
                            <p>Total Time: {formattedTotalOverallTime}</p>
                        </div>
                    )}
                </Card>
            </Modal>
        </>
    );
};

function toFixedNumber(num: number, digits: number) {
    return parseFloat(num.toFixed(digits));
}

export default FileUploadComponent;
