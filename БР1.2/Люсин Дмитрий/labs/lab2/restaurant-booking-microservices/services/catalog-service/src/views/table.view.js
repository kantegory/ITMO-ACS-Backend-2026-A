const tableView = (table) => {
  if (!table) return null;

  return {
    id: table.id,
    restaurant_id: table.restaurant_id,
    table_number: table.table_number,
    seats_count: table.seats_count,
    is_active: table.is_active,
    created_at: table.created_at || table.createdAt,
    updated_at: table.updated_at || table.updatedAt
  };
};

module.exports = { tableView };
