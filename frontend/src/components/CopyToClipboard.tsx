"use client";
import { CopyOutlined, CopyFilled } from "@ant-design/icons";
import { useNotification } from "@refinedev/core";
import { Button, Tooltip } from "antd";
import React from "react";
import { CopyToClipboard as CopyToClipboardComp } from "react-copy-to-clipboard";

export const CopyToClipboard = ({ text }: { text: string }) => {
    const { open } = useNotification();
    const [copied, setCopied] = React.useState(false);

    // use copy filled icon if copied for 5 seconds
    React.useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 5000);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [copied]);

    return (
        <Tooltip title={copied ? "Copied" : text}>
            <CopyToClipboardComp
                onCopy={() => {
                    // open?.({
                    //     message: "Copied to clipboard",
                    //     type: "success",
                    // });
                    setCopied(true);
                }}
                text={text}
            >
                <Button icon={copied ? <CopyFilled /> : <CopyOutlined />} />
            </CopyToClipboardComp>
        </Tooltip>
    );
};
