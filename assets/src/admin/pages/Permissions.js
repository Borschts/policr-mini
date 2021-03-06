import React, { useEffect, useCallback, useState } from "react";
import useSWR from "swr";
import tw, { styled } from "twin.macro";
import Switch from "react-switch";
import fetch from "unfetch";

import {
  PageHeader,
  PageLoading,
  PageReLoading,
  PageSection,
  PageSectionHeader,
  PageSectionTitle,
} from "../components";
import { camelizeJson, toastErrors, updateInNewArray } from "../helper";
import { useDispatch, useSelector } from "react-redux";
import { loadSelected } from "../slices/chats";
import PageBody from "../components/PageBody";

const OperatingText = styled.span`
  ${tw`text-xs text-blue-400 font-bold cursor-pointer`}
`;

const TableHeaderCell = styled.th`
  ${tw`font-normal text-gray-500 text-left uppercase`}
`;

const TableDataRow = styled.tr``;
const TableDataCell = styled.td(() => [
  tw`border border-dashed border-0 border-t border-gray-300`,
  tw`py-2 text-sm`,
]);

const makeEndpoint = (chat_id) => `/admin/api/chats/${chat_id}/permissions`;

const switchHeight = 18;
const switchWidth = 36;

function makeFullname({ firstName, lastName }) {
  let name = firstName;
  if (lastName && lastName.trim() != "") name += ` ${lastName}`;

  return name;
}

async function changeBoolField(field, id, value) {
  const endpoint = `/admin/api/permissions/${id}/${field}?value=${value}`;

  return fetch(endpoint, { method: "PUT" }).then((r) => camelizeJson(r));
}

async function withdraw(id) {
  const endpoint = `/admin/api/permissions/${id}/withdraw`;

  return fetch(endpoint, { method: "DELETE" }).then((r) => camelizeJson(r));
}

export default () => {
  const dispatch = useDispatch();
  const chatsState = useSelector((state) => state.chats);

  const { data, error, mutate } = useSWR(
    chatsState && chatsState.isLoaded && chatsState.selected
      ? makeEndpoint(chatsState.selected)
      : null
  );
  const [permissions, setPermissions] = useState([]);

  const handleBoolFieldChange = useCallback(
    async (field, index, value) => {
      const result = await changeBoolField(field, permissions[index].id, value);

      if (result.errors) {
        toastErrors(result.errors);
        return;
      }

      const newPermissions = updateInNewArray(
        permissions,
        result.permission,
        index
      );

      setPermissions(newPermissions);
    },
    [permissions]
  );

  const handleWithdraw = useCallback(
    async (index) => {
      const result = await withdraw(permissions[index].id);

      if (result.errors) {
        toastErrors(result.errors);
        return;
      }

      const newPermissions = permissions.filter((_, i) => i !== index);

      setPermissions(newPermissions);
    },
    [permissions]
  );

  useEffect(() => {
    if (data && data.permissions) setPermissions(data.permissions);
  }, [data]);

  const isLoaded = () => chatsState.isLoaded && !error && data && !data.errors;

  let title = "管理员权限";
  if (isLoaded()) title += ` / ${data.chat.title}`;

  useEffect(() => {
    if (data && data.errors) toastErrors(data.errors);
    if (isLoaded()) dispatch(loadSelected(data.chat));
  }, [data]);

  return (
    <>
      <PageHeader title={title} />
      {isLoaded() ? (
        <PageBody>
          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>权限列表</PageSectionTitle>
            </PageSectionHeader>
            <main>
              <table tw="w-full border border-solid border-0 border-b border-t border-gray-300 mt-1">
                <thead>
                  <tr>
                    <TableHeaderCell tw="w-3/12">用户名称</TableHeaderCell>
                    <TableHeaderCell tw="w-2/12 text-center">
                      设置 / 可读
                    </TableHeaderCell>
                    <TableHeaderCell tw="w-2/12 text-center">
                      设置 / 可写
                    </TableHeaderCell>
                    <TableHeaderCell tw="w-2/12 text-center">
                      保持同步
                    </TableHeaderCell>
                    <TableHeaderCell tw="w-3/12">
                      <span tw="float-right mr-6">操作</span>
                    </TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission, index) => (
                    <TableDataRow key={permission.id}>
                      <TableDataCell tw="w-3/12 break-all">
                        {makeFullname(permission.user)}
                      </TableDataCell>
                      <TableDataCell tw="w-2/12">
                        <div tw="flex justify-center">
                          <Switch
                            height={switchHeight}
                            width={switchWidth}
                            checked={permission.readable}
                            onChange={(v) =>
                              handleBoolFieldChange("readable", index, v)
                            }
                          />
                        </div>
                      </TableDataCell>
                      <TableDataCell tw="w-2/12 text-center">
                        <div tw="flex justify-center">
                          <Switch
                            height={switchHeight}
                            width={switchWidth}
                            checked={permission.writable}
                            onChange={(v) =>
                              handleBoolFieldChange("writable", index, v)
                            }
                          />
                        </div>
                      </TableDataCell>
                      <TableDataCell tw="w-2/12 text-center">
                        <div tw="flex justify-center">
                          <Switch
                            height={switchHeight}
                            width={switchWidth}
                            checked={!permission.customized}
                            onChange={(v) =>
                              handleBoolFieldChange("customized", index, !v)
                            }
                          />
                        </div>
                      </TableDataCell>
                      <TableDataCell>
                        <div tw="float-right mr-6">
                          <OperatingText tw="mr-1">同步</OperatingText>
                          <OperatingText tw="mr-1">禁用</OperatingText>
                          <OperatingText onClick={() => handleWithdraw(index)}>
                            撤销
                          </OperatingText>
                        </div>
                      </TableDataCell>
                    </TableDataRow>
                  ))}
                </tbody>
              </table>
            </main>
          </PageSection>
        </PageBody>
      ) : error ? (
        <PageReLoading mutate={mutate} />
      ) : (
        <PageLoading />
      )}
    </>
  );
};
