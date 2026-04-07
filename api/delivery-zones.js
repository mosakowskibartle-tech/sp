export default function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json([{ id: 1, name: 'Сходня', min_order: 0, delivery_cost: 0 }]);
}
