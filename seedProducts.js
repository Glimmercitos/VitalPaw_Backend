const Product = require('./src/models/Product');

const products = [
  {
    name: 'Pelota para perro',
    image: 'https://ferreteriavidri.com/images/items/large/449317.jpg',
    priceInVitalCoins: 20,
    description: 'Pelota de goma resistente ideal para juegos de lanzar y traer con tu perro.'
  },
  {
    name: 'Ratón de juguete para gato',
    image: 'https://veterinariaelcountry.com/wp-content/uploads/Juguete-Para-Gato-Raton-De-Cuerda-11-Cm.jpg',
    priceInVitalCoins: 15,
    description: 'Ratón pequeño con sonido para estimular el instinto cazador de tu gato.'
  },

  {
    name: 'Correa ajustable',
    image: 'https://m.media-amazon.com/images/I/61umzlcwBPL.jpg',
    priceInVitalCoins: 30,
    description: 'Correa resistente y ajustable para paseos cómodos y seguros.'
  },
  {
    name: 'Collar con placa',
    image: 'https://m.media-amazon.com/images/I/715nt0hD9rL.jpg',
    priceInVitalCoins: 25,
    description: 'Collar con diseño elegante y placa para identificación de tu mascota.'
  },

  {
    name: 'Croquetas para perro 1kg',
    image: 'https://walmartsv.vtexassets.com/arquivos/ids/583377/86984_01.jpg?v=638661739367300000',
    priceInVitalCoins: 50,
    description: 'Croquetas nutritivas para perros adultos, con sabor a carne y vegetales.'
  },
  {
    name: 'Alimento húmedo para gato',
    image: 'https://purina.com.sv/sites/default/files/styles/webp/public/2023-10/Sobre_Felix_Adulto_Pollo_1.png.webp?itok=NTeu7Byf',
    priceInVitalCoins: 40,
    description: 'Comida húmeda rica en proteínas para gatos exigentes.'
  }
];

async function seedProductsIfNeeded() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(products);
      console.log('🛒 Productos de la VitalShop creados correctamente');
    } else {
      console.log(`La base de datos ya contiene ${count} productos`);
    }
  } catch (error) {
    console.error('Error al crear productos iniciales:', error.message);
  }
}

module.exports = seedProductsIfNeeded;
