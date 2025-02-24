"use client";

import { Suspense } from "react";

import { CopyToClipboard } from "@components/CopyToClipboard";
import FileUploadComponent from "@components/FileUploadComponent";
import {
    FilterDropdown,
    getDefaultSortOrder,
    List,
    useTable,
} from "@refinedev/antd";
import { getDefaultFilter, useDeleteMany } from "@refinedev/core";
import { Button, Flex, Input, Select, Space, Table, Typography } from "antd";
import { FilterDropdownProps } from "antd/es/table/interface";
import React from "react";

export default function IndexPage() {
    const {
        tableProps,
        filters,
        setFilters,
        sorters,
        tableQuery: tableQueryResult,
    } = useTable({
        resource: "student_grades",
        liveMode: 'auto',
        pagination: {
            pageSize: 20,
        },
        filters: {
            initial: [
                {
                    field: "student_name",
                    operator: "contains",
                    value: [],
                },
            ],
        },
    });

    const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>(
        []
    );

    const {
        mutate,
        isSuccess,
        isLoading: deleteManyIsLoading,
    } = useDeleteMany();

    const deleteSelectedItems = () => {
        mutate({
            resource: "student_grades",
            ids: selectedRowKeys.map(String),
        });
    };

    React.useEffect(() => {
        if (isSuccess) {
            setSelectedRowKeys([]);
        }
    }, [isSuccess]);

    const onSelectChange = (selectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(selectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
        ],
    };

    const hasSelected = selectedRowKeys.length > 0;

    return (
        <div style={{ padding: 40 }}>
            <Suspense>
                <List
                    headerProps={{
                        extra: (
                            <div className="flex items-center h-[65px]">
                                <Suspense fallback={<></>}>
                                    <Space>
                                        {hasSelected && (
                                            <Button
                                                danger
                                                onClick={deleteSelectedItems}
                                                disabled={!hasSelected}
                                                loading={deleteManyIsLoading}
                                            >
                                                Delete selected{" "}
                                                {selectedRowKeys.length} items
                                            </Button>
                                        )}
                                        <FileUploadComponent />
                                    </Space>
                                </Suspense>
                            </div>
                        ),
                    }}
                    title={
                        <Flex
                            gap={5}
                            align="start"
                            justify="space-between"
                            vertical
                            className="text-wrap"
                        >
                            <Typography.Title level={2} style={{ margin: 0 }}>
                                Student Grades
                            </Typography.Title>
                            <Typography.Text type="secondary">
                                View student grades
                            </Typography.Text>
                        </Flex>
                    }
                >
                    <Table
                        rowSelection={rowSelection}
                        {...tableProps}
                        size="small"
                        rowKey="id"
                        loading={tableQueryResult.isFetching}
                        scroll={{ x: 400 }}
                    >
                        <Table.Column
                            dataIndex="id"
                            title={"ID"}
                            key={"id"}
                            align="center"
                            render={(value) => <CopyToClipboard text={value} />}
                        />
                        <Table.Column
                            dataIndex="student_name"
                            title={"Student Name"}
                            key={"student_name"}
                            sorter={{ multiple: 2 }}
                            defaultSortOrder={getDefaultSortOrder(
                                "student_name",
                                sorters
                            )}
                            defaultFilteredValue={getDefaultFilter(
                                "student_name",
                                filters,
                                "contains"
                            )}
                            filterDropdown={(props: FilterDropdownProps) => (
                                <FilterDropdown {...props}>
                                    <Input placeholder={"Search"} />
                                </FilterDropdown>
                            )}
                        />
                        <Table.Column
                            dataIndex={"subject"}
                            title={"Subject"}
                            filterDropdown={(props: FilterDropdownProps) => (
                                <FilterDropdown {...props}>
                                    <Select
                                        style={{ minWidth: 200 }}
                                        placeholder={"Search Subject"}
                                        allowClear
                                    >
                                        {/* 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'English Literature', 'Computer Science', 'Art', 'Music', 'Geography'] */}
                                        <Select.Option value="Mathematics">
                                            {"Mathematics"}
                                        </Select.Option>
                                        <Select.Option value="Physics">
                                            {"Physics"}
                                        </Select.Option>
                                        <Select.Option value="Chemistry">
                                            {"Chemistry"}
                                        </Select.Option>
                                        <Select.Option value="Biology">
                                            {"Biology"}
                                        </Select.Option>
                                        <Select.Option value="History">
                                            {"History"}
                                        </Select.Option>
                                        <Select.Option value="English Literature">
                                            {"English Literature"}
                                        </Select.Option>
                                        <Select.Option value="Computer Science">
                                            {"Computer Science"}
                                        </Select.Option>
                                        <Select.Option value="Art">
                                            {"Art"}
                                        </Select.Option>
                                        <Select.Option value="Music">
                                            {"Music"}
                                        </Select.Option>
                                        <Select.Option value="Geography">
                                            {"Geography"}
                                        </Select.Option>
                                    </Select>
                                </FilterDropdown>
                            )}
                        />
                        <Table.Column
                            dataIndex="grade"
                            title={"Grade"}
                            key="grade"
                            sorter={{ multiple: 2 }}
                            defaultSortOrder={getDefaultSortOrder(
                                "grade",
                                sorters
                            )}
                        />
                    </Table>
                </List>
            </Suspense>
        </div>
    );
}
