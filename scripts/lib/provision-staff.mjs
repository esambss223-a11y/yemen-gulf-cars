// Creates an additional account. Existing accounts are never repaired or updated here.
export async function provisionStaff(client, { username, password, name, beforeCreate }) {
  if (!/^[a-z0-9._-]{1,64}$/.test(username) || !name.trim() || password.length < 16) {
    throw new Error('Invalid new account details.');
  }
  const { data: existingStaff, error: staffError } = await client.from('staff').select('*');
  if (staffError || !existingStaff) throw new Error('Could not inventory existing staff.');
  if (existingStaff.some((row) => row.username.toLowerCase() === username)) {
    throw new Error('Username already exists; no existing account was changed.');
  }

  const existingUsers = [];
  let complete = false;
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users) throw new Error('Could not inventory existing sign-in accounts.');
    existingUsers.push(...data.users);
    if (data.users.length < 1000) { complete = true; break; }
  }
  if (!complete) throw new Error('Account inventory exceeded the safety limit.');
  const email = `${username}@${new URL(client.supabaseUrl).hostname}`;
  if (existingUsers.some((user) => user.email?.toLowerCase() === email)) {
    throw new Error('Sign-in account already exists; its password was not changed.');
  }

  // Persist recovery details before the first remote write. Failure aborts creation.
  await beforeCreate({ existingStaff, existingAuthIds: existingUsers.map((user) => user.id), email });
  const { data: created, error: createError } = await client.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, username, role: 'super_admin' },
  });
  if (createError || !created.user) {
    throw new Error(`New sign-in account could not be created (${createError?.code || 'unknown'}).`);
  }
  const id = created.user.id;
  if (existingUsers.some((user) => user.id === id)) {
    throw new Error('Unexpected existing account ID returned; directory write stopped.');
  }
  const row = { id, name, username, role: 'super_admin', phone: '', active: true };
  const { data: staff, error: insertError } = await client.from('staff')
    .insert(row).select('id, name, username, role, phone, active').single();
  if (insertError || !staff) {
    const { error: rollbackError } = await client.auth.admin.deleteUser(id);
    if (rollbackError) {
      throw new Error(`New account ${id} needs manual recovery; its directory insert and rollback failed.`);
    }
    throw new Error('Directory insert failed; only the newly created sign-in account was rolled back.');
  }
  return { staff, email, existingStaff, existingAuthIds: existingUsers.map((user) => user.id) };
}
