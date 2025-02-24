"use client";
import { UploadOutlined } from "@ant-design/icons";
import {
    Alert,
    Button,
    Card,
    Divider,
    Modal,
    Progress,
    Typography,
    Upload,
    message,
} from "antd";
import { RcFile } from "antd/lib/upload";
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import React, { useEffect, useState } from "react";

interface CustomUploadFile extends UploadFile {
    uploadProgress?: number;
    processProgress?: number;
    uploadStartTime?: number;
    uploadEndTime?: number;
    processingStartTime?: number;
    processingEndTime?: number;
    fileId?: string;
    recordsProcessed?: number;
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
                fileId: undefined,
                recordsProcessed: 0,
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
        setUploading(true);

        fileList.forEach((fileObj, index) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            const originFileObj = fileObj.originFileObj as RcFile;
            if (originFileObj) {
                formData.append("file", originFileObj);
            }

            // Track upload progress
            // @ts-ignore
            xhr.upload.onprogress = (
                event: ProgressEvent<XMLHttpRequestEventTarget>
            ): void => {
                if (event.lengthComputable) {
                    const total = event.total;
                    const loaded = event.loaded;
                    const uploadProgress = (loaded / total) * 100;

                    setFileList((prevFileList) => {
                        const newFileList = [...prevFileList];
                        const fObj = newFileList[index];
                        // Update upload progress
                        fObj.uploadProgress = uploadProgress;
                        // Set upload start time if not already set
                        if (!fObj.uploadStartTime) {
                            fObj.uploadStartTime = Date.now();
                        }
                        // Set upload end time when upload completes
                        if (uploadProgress === 100 && !fObj.uploadEndTime) {
                            fObj.uploadEndTime = Date.now();
                        }
                        return newFileList;
                    });
                }
            };

            // Handle upload completion
            xhr.onload = (): void => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Request completed successfully
                    // Parse the response to get file_id
                    let response;
                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.error("Error parsing response:", e);
                    }
                    const { file_id } = response || {};
                    if (file_id) {
                        setFileList((prevFileList) => {
                            const newFileList = [...prevFileList];
                            const fObj = newFileList[index];
                            fObj.fileId = file_id;
                            // Assume processing starts immediately after upload completes
                            fObj.processingStartTime = Date.now();
                            return newFileList;
                        });
                    }
                } else {
                    // HTTP error occurred
                    setUploading(false);
                    message.error(
                        `Upload failed for file ${fileObj.name} with status ${xhr.status}: ${xhr.statusText}`
                    );
                }
            };

            xhr.onerror = (): void => {
                setUploading(false);
                message.error(
                    `Network error occurred during upload of file ${fileObj.name}.`
                );
            };

            xhr.open("POST", "/api/grades/upload");
            xhr.send(formData);
        });
    };

    // Polling for processing progress
    useEffect(() => {
        // Check if there are any files that need polling
        const filesToPoll = fileList.filter(
            (file) => file.fileId && file.processProgress !== 100
        );

        if (filesToPoll.length > 0) {
            const intervalId = setInterval(() => {
                // Fetch progress updates
                fetch("/api/grades/progress")
                    .then((res) => res.json())
                    .then((data) => {
                        // data is an array of {file_id, records_processed, progress}
                        setFileList((prevFileList) => {
                            return prevFileList.map((file) => {
                                if (file.fileId) {
                                    const progressData = data.find(
                                        (d: any) => d.file_id === file.fileId
                                    );
                                    if (progressData) {
                                        const {
                                            progress,
                                            records_processed,
                                        } = progressData;
                                        const newFile = {
                                            ...file,
                                            processProgress: progress,
                                            recordsProcessed: records_processed,
                                        };
                                        if (
                                            progress === 100 &&
                                            !newFile.processingEndTime
                                        ) {
                                            newFile.processingEndTime = Date.now();
                                        }
                                        return newFile;
                                    }
                                }
                                return file;
                            });
                        });
                    })
                    .catch((err) => {
                        console.error("Error fetching progress:", err);
                    });
            }, 750);

            return () => clearInterval(intervalId);
        }
    }, [fileList]);

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
                        <Button
                            icon={<UploadOutlined />}
                            disabled={uploading}
                        >
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
                    <div style={{ marginTop: "16px" }}>
                        {fileList.map((fileObj, idx) => (
                            <React.Fragment key={fileObj.uid}>
                                <div>
                                    <Typography.Title level={5}>
                                        {fileObj.name}
                                    </Typography.Title>
                                    {/* Upload Progress */}
                                    {fileObj.uploadProgress !== undefined && (
                                        <>
                                            <div>
                                                Upload Progress:{" "}
                                                {fileObj.uploadProgress.toFixed(
                                                    2
                                                )}
                                                %
                                            </div>
                                            <Progress
                                                percent={toFixedNumber(
                                                    fileObj.uploadProgress,
                                                    2
                                                )}
                                                status={
                                                    fileObj.uploadProgress ===
                                                    100
                                                        ? "success"
                                                        : "active"
                                                }
                                            />
                                            {fileObj.uploadEndTime && (
                                                <p>
                                                    Upload Time:{" "}
                                                    {formatDuration(
                                                        fileObj.uploadStartTime,
                                                        fileObj.uploadEndTime
                                                    )}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {/* Processing Progress */}
                                    {fileObj.fileId && (
                                        <>
                                            {fileObj.processProgress !==
                                                undefined && (
                                                <>
                                                    <div>
                                                        Processing Progress:{" "}
                                                        {fileObj.processProgress}
                                                        %
                                                    </div>
                                                    <Progress
                                                        percent={
                                                            fileObj.processProgress
                                                        }
                                                        status={
                                                            fileObj.processProgress ===
                                                            100
                                                                ? "success"
                                                                : "active"
                                                        }
                                                    />
                                                    <div>
                                                        Records Processed:{" "}
                                                        {fileObj.recordsProcessed ||
                                                            0}
                                                    </div>
                                                    {fileObj.processingEndTime && (
                                                        <p>
                                                            Processing Time:{" "}
                                                            {formatDuration(
                                                                fileObj.processingStartTime,
                                                                fileObj.processingEndTime
                                                            )}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                    {/* Total Time */}
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
                                </div>
                                {idx < fileList.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Overall Metrics */}
                    {totalOverallTime > 0 && (
                        <div style={{ marginTop: "16px" }}>
                            <h3>Overall Metrics:</h3>
                            <p>
                                Total Upload Time: {formattedTotalUploadTime}
                            </p>
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