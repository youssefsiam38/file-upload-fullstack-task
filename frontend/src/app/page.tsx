"use client";

import { Suspense } from "react";

import { CopyToClipboard } from "@components/CopyToClipboard";
import {
    FilterDropdown,
    getDefaultSortOrder,
    List,
    useTable,
} from "@refinedev/antd";
import { getDefaultFilter, useDeleteMany } from "@refinedev/core";
import { Flex, Input, Select, Table, Typography } from "antd";
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
        // sorters: {
        //     initial: [
        //         {
        //             field: "source_timestamp",
        //             order: "desc",
        //         },
        //     ],
        // },
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
            // permanent: [
            //     {
            //         field: "tenant_id",
            //         operator: "eq",
            //         value: settingsOverview.id,
            //     },
            //     {
            //         field: "brands.brand_type",
            //         operator: "eq",
            //         value: listOwnedFeedback ? "owned" : "competitor",
            //     },
            //     {
            //         operator: "or",
            //         value: [
            //             {
            //                 field: "title",
            //                 operator: "nnull",
            //                 value: "null",
            //             },
            //             {
            //                 field: "description",
            //                 operator: "nnull",
            //                 value: "null",
            //             },
            //         ],
            //     },
            // ],
        },
        // meta: {
        //     select: tableSelectString,
        // },
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
            resource: "feedback",
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

    console.log(tableQueryResult);

    return (
        <Suspense>
            <List
                headerProps={
                    {
                        // extra: (
                        //     <div className="flex items-center h-[65px]">
                        //         <Suspense fallback={<></>}>
                        //             <Space>
                        //                 {hasSelected && (
                        //                     <Button
                        //                         danger
                        //                         onClick={deleteSelectedItems}
                        //                         disabled={!hasSelected}
                        //                         loading={deleteManyIsLoading}
                        //                     >
                        //                         {formatString(
                        //                             t["delete_selected"],
                        //                             {
                        //                                 feedback_plural:
                        //                                     settingsOverview
                        //                                         .tenant_naming_settings
                        //                                         .feedback_name
                        //                                         .plural ||
                        //                                     "feedback",
                        //                                 selected_count:
                        //                                     selectedRowKeys.length.toString(),
                        //                             }
                        //                         ) ||
                        //                             `Delete selected ${selectedRowKeys.length} feedback`}
                        //                     </Button>
                        //                 )}
                        //                 <Switch
                        //                     checkedChildren={
                        //                         t["owned"] || "Owned Brands"
                        //                     }
                        //                     unCheckedChildren={
                        //                         t["competitor"] ||
                        //                         "Competitor Brands"
                        //                     }
                        //                     checked={listOwnedFeedback}
                        //                     onChange={() =>
                        //                         setListOwnedFeedback(
                        //                             !listOwnedFeedback
                        //                         )
                        //                     }
                        //                     loading={tableQueryResult.isLoading}
                        //                 />
                        //                 <CreateFeedbackModalButton type="primary">
                        //                     {formatString(t["add_feedback"], {
                        //                         feedback_single:
                        //                             settingsOverview
                        //                                 .tenant_naming_settings
                        //                                 .feedback_name.name ||
                        //                             "feedback",
                        //                     }) || "Add Feedback"}
                        //                 </CreateFeedbackModalButton>
                        //             </Space>
                        //         </Suspense>
                        //     </div>
                        // ),
                    }
                }
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
                        defaultSortOrder={getDefaultSortOrder("grade", sorters)}
                    />

                    {/*<Table.Column
                        dataIndex={["rating", "value"]}
                        title={t["rating"] || "Rating"}
                        key="rating"
                        render={(value, record: any) => {
                            return (
                                <>
                                    {record.rating?.value ? (
                                        <div className="flex gap-2 items-center text-nowrap">
                                            <Rate
                                                value={1}
                                                disabled
                                                count={1}
                                            />
                                            {record.rating?.value} /{" "}
                                            {record.rating?.rating_max}
                                        </div>
                                    ) : (
                                        "-"
                                    )}
                                </>
                            );
                        }}
                    />
                    <Table.Column
                        dataIndex="customer_id"
                        title={
                            settingsOverview.tenant_naming_settings
                                .customer_name.name || "Customer"
                        }
                        render={(value, record: any) => {
                            return (
                                <>
                                    {record.customers?.id ? (
                                        <Link
                                            href={`/app/customers/${record.customers?.id}/edit`}
                                            style={{
                                                color: token?.colorText,
                                                textDecoration: "underline",
                                            }}
                                        >
                                            <div className="flex items-center">
                                                {record.customers?.image_url ? (
                                                    <Avatar
                                                        src={
                                                            record.customers
                                                                ?.image_url
                                                        }
                                                        size={32}
                                                        style={{
                                                            marginRight: 8,
                                                        }}
                                                    />
                                                ) : null}
                                                {(record?.customers?.name
                                                    ? record.customers?.name
                                                    : record.customers
                                                          ?.email) || "-"}
                                            </div>
                                        </Link>
                                    ) : (
                                        <>
                                            {record.customers?.name ? (
                                                <TextField
                                                    value={
                                                        (record?.customers?.name
                                                            ? record.customers
                                                                  ?.name
                                                            : record.customers
                                                                  ?.email) ||
                                                        "-"
                                                    }
                                                />
                                            ) : (
                                                <TextField
                                                    value={
                                                        record.metadata
                                                            ?.customer_name ||
                                                        "-"
                                                    }
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            );
                        }}
                    />
                    {settingsOverview.tenant_general_settings_customer_type ===
                        "B2B" && (
                        <Table.Column
                            dataIndex={["customers", "company_id"]}
                            title={
                                settingsOverview.tenant_naming_settings
                                    .company_name.name || "Company"
                            }
                            filterDropdown={(props: FilterDropdownProps) => (
                                <FilterDropdown {...props}>
                                    <Select
                                        {...companiesSelectProps}
                                        style={{ minWidth: 200 }}
                                        placeholder={
                                            formatString(t["search_company"], {
                                                company_single:
                                                    settingsOverview
                                                        .tenant_naming_settings
                                                        .company_name.name ||
                                                    "Company",
                                            }) || "Search Company"
                                        }
                                        allowClear
                                    />
                                </FilterDropdown>
                            )}
                            render={(value, record: any) => {
                                return (
                                    <>
                                        {record.customers?.company_id ? (
                                            <Link
                                                href={`/app/companies/${record.customers?.company_id}/edit`}
                                                style={{
                                                    color: token?.colorText,
                                                    textDecoration: "underline",
                                                }}
                                            >
                                                {record.customers
                                                    ?.company_name || "-"}
                                            </Link>
                                        ) : (
                                            <TextField
                                                value={
                                                    record.customers
                                                        ?.company_name || "-"
                                                }
                                            />
                                        )}
                                    </>
                                );
                            }}
                        />
                    )}
                    <Table.Column
                        dataIndex="brand_id"
                        title={t["brand"] || "Brand"}
                        filterDropdown={(props: FilterDropdownProps) => (
                            <FilterDropdown {...props}>
                                <Select
                                    {...brandsSelectProps}
                                    style={{ minWidth: 200 }}
                                    placeholder={
                                        t["search_brand"] || "Search Brand"
                                    }
                                    allowClear
                                />
                            </FilterDropdown>
                        )}
                        render={(value, record: any) => {
                            return (
                                <>
                                    <TextField
                                        value={record.brands?.name || "-"}
                                        style={{
                                            //  word-break: normal;
                                            //  white-space: normal;
                                            wordBreak: "normal",
                                            whiteSpace: "normal",
                                        }}
                                    />
                                </>
                            );
                        }}
                    />
                    <Table.Column
                        dataIndex="source_id"
                        title={t["source"] || "Source"}
                        filterDropdown={(props: FilterDropdownProps) => (
                            <FilterDropdown {...props}>
                                <Select
                                    {...sourcesSelectProps}
                                    style={{ minWidth: 200 }}
                                    placeholder={
                                        t["search_source"] || "Search Source"
                                    }
                                    allowClear
                                />
                            </FilterDropdown>
                        )}
                        render={(value, record: any) => {
                            return (
                                <TextField
                                    value={record?.sources?.name || "-"}
                                    className="text-nowrap"
                                />
                            );
                        }}
                    />
                    <Table.Column
                        dataIndex="source_timestamp"
                        title={t["timestamp"] || "Timestamp"}
                        render={(value) => moment(value).format("ll")}
                        filterDropdown={(props) => (
                            <FilterDropdown
                                {...props}
                                mapValue={(selectedKeys: any, event: any) => {
                                    return rangePickerFilterMapper(
                                        selectedKeys,
                                        event
                                    );
                                }}
                            >
                                <DatePicker.RangePicker />
                            </FilterDropdown>
                        )}
                        defaultFilteredValue={getDefaultFilter(
                            "source_timestamp",
                            filters,
                            "between"
                        )}
                    />
                    <Table.Column
                        title={t["actions"] || "Actions"}
                        width={200}
                        align="center"
                        render={(_, record: any) => {
                            return (
                                <Space>
                                    <ShowButton
                                        recordItemId={record?.id}
                                        resource="feedback"
                                        size="small"
                                    >
                                        {t["view"] || "View"}
                                    </ShowButton>
                                    <DeleteButton
                                        recordItemId={record?.id}
                                        confirmTitle={
                                            t["are_you_sure"] || "Are you sure?"
                                        }
                                        confirmOkText={t["delete"] || "Delete"}
                                        confirmCancelText={
                                            t["cancel"] || "Cancel"
                                        }
                                        resource="feedback"
                                        hideText
                                        size="small"
                                    />
                                </Space>
                            );
                        }}
                    /> */}
                </Table>
            </List>
        </Suspense>
    );
}
