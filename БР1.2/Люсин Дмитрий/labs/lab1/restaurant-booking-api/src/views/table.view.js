const toTableResponse = (table) => ({
  id: table.id,
  restaurant_id: table.restaurant_id,
  table_number: table.table_number,
  seats_count: table.seats_count,
  is_active: table.is_active,
});

module.exports = { toTableResponse };
