/**
 * Classic world map definition inspired by RISK
 */

const classicMap = {
  id: 'classic',
  name: 'Classic World Map',
  
  // Continent definitions
  continents: [
    {
      id: 'north-america',
      name: 'North America',
      bonusArmies: 5,
      color: '#FFC0CB' // pink
    },
    {
      id: 'south-america',
      name: 'South America',
      bonusArmies: 2,
      color: '#FFFF00' // yellow
    },
    {
      id: 'europe',
      name: 'Europe',
      bonusArmies: 5,
      color: '#0000FF' // blue
    },
    {
      id: 'africa',
      name: 'Africa',
      bonusArmies: 3,
      color: '#FFA500' // orange
    },
    {
      id: 'asia',
      name: 'Asia',
      bonusArmies: 7,
      color: '#00FF00' // green
    },
    {
      id: 'australia',
      name: 'Australia',
      bonusArmies: 2,
      color: '#800080' // purple
    }
  ],
  
  // Territory definitions
  territories: [
    // North America
    {
      id: 'alaska',
      name: 'Alaska',
      continent: 'north-america',
      adjacent: ['northwest-territory', 'alberta', 'kamchatka'],
      coordinates: { x: 115, y: 120 },
      resources: { production: 1 }
    },
    {
      id: 'northwest-territory',
      name: 'Northwest Territory',
      continent: 'north-america',
      adjacent: ['alaska', 'alberta', 'ontario', 'greenland'],
      coordinates: { x: 180, y: 120 },
      resources: { food: 1 }
    },
    {
      id: 'greenland',
      name: 'Greenland',
      continent: 'north-america',
      adjacent: ['northwest-territory', 'ontario', 'quebec', 'iceland'],
      coordinates: { x: 280, y: 90 },
      resources: { research: 1 }
    },
    {
      id: 'alberta',
      name: 'Alberta',
      continent: 'north-america',
      adjacent: ['alaska', 'northwest-territory', 'ontario', 'western-united-states'],
      coordinates: { x: 160, y: 150 },
      resources: { production: 1 }
    },
    {
      id: 'ontario',
      name: 'Ontario',
      continent: 'north-america',
      adjacent: ['northwest-territory', 'alberta', 'western-united-states', 'eastern-united-states', 'quebec', 'greenland'],
      coordinates: { x: 200, y: 160 },
      resources: { wealth: 1, production: 1 }
    },
    {
      id: 'quebec',
      name: 'Quebec',
      continent: 'north-america',
      adjacent: ['greenland', 'ontario', 'eastern-united-states'],
      coordinates: { x: 240, y: 160 },
      resources: { research: 1 }
    },
    {
      id: 'western-united-states',
      name: 'Western United States',
      continent: 'north-america',
      adjacent: ['alberta', 'ontario', 'eastern-united-states', 'central-america'],
      coordinates: { x: 160, y: 190 },
      resources: { wealth: 2 }
    },
    {
      id: 'eastern-united-states',
      name: 'Eastern United States',
      continent: 'north-america',
      adjacent: ['western-united-states', 'ontario', 'quebec', 'central-america'],
      coordinates: { x: 210, y: 200 },
      resources: { wealth: 2, research: 1 }
    },
    {
      id: 'central-america',
      name: 'Central America',
      continent: 'north-america',
      adjacent: ['western-united-states', 'eastern-united-states', 'venezuela'],
      coordinates: { x: 180, y: 230 },
      resources: { food: 2 }
    },
    
    // South America
    {
      id: 'venezuela',
      name: 'Venezuela',
      continent: 'south-america',
      adjacent: ['central-america', 'peru', 'brazil'],
      coordinates: { x: 220, y: 260 },
      resources: { production: 1 }
    },
    {
      id: 'peru',
      name: 'Peru',
      continent: 'south-america',
      adjacent: ['venezuela', 'brazil', 'argentina'],
      coordinates: { x: 220, y: 300 },
      resources: { food: 1, production: 1 }
    },
    {
      id: 'brazil',
      name: 'Brazil',
      continent: 'south-america',
      adjacent: ['venezuela', 'peru', 'argentina', 'north-africa'],
      coordinates: { x: 260, y: 290 },
      resources: { food: 2, wealth: 1 }
    },
    {
      id: 'argentina',
      name: 'Argentina',
      continent: 'south-america',
      adjacent: ['peru', 'brazil'],
      coordinates: { x: 230, y: 340 },
      resources: { food: 2 }
    },
    
    // Europe
    {
      id: 'iceland',
      name: 'Iceland',
      continent: 'europe',
      adjacent: ['greenland', 'great-britain', 'scandinavia'],
      coordinates: { x: 340, y: 120 },
      resources: { research: 1 }
    },
    {
      id: 'great-britain',
      name: 'Great Britain',
      continent: 'europe',
      adjacent: ['iceland', 'scandinavia', 'western-europe', 'northern-europe'],
      coordinates: { x: 360, y: 150 },
      resources: { wealth: 1, research: 1 }
    },
    {
      id: 'scandinavia',
      name: 'Scandinavia',
      continent: 'europe',
      adjacent: ['iceland', 'great-britain', 'northern-europe', 'ukraine'],
      coordinates: { x: 400, y: 120 },
      resources: { production: 1 }
    },
    {
      id: 'western-europe',
      name: 'Western Europe',
      continent: 'europe',
      adjacent: ['great-britain', 'northern-europe', 'southern-europe', 'north-africa'],
      coordinates: { x: 370, y: 180 },
      resources: { wealth: 2 }
    },
    {
      id: 'northern-europe',
      name: 'Northern Europe',
      continent: 'europe',
      adjacent: ['great-britain', 'scandinavia', 'ukraine', 'southern-europe', 'western-europe'],
      coordinates: { x: 400, y: 160 },
      resources: { production: 1, wealth: 1 }
    },
    {
      id: 'southern-europe',
      name: 'Southern Europe',
      continent: 'europe',
      adjacent: ['western-europe', 'northern-europe', 'ukraine', 'middle-east', 'egypt', 'north-africa'],
      coordinates: { x: 410, y: 190 },
      resources: { wealth: 1, food: 1 }
    },
    {
      id: 'ukraine',
      name: 'Ukraine',
      continent: 'europe',
      adjacent: ['scandinavia', 'northern-europe', 'southern-europe', 'middle-east', 'afghanistan', 'ural'],
      coordinates: { x: 450, y: 150 },
      resources: { production: 2 }
    },
    
    // Africa
    {
      id: 'north-africa',
      name: 'North Africa',
      continent: 'africa',
      adjacent: ['brazil', 'western-europe', 'southern-europe', 'egypt', 'east-africa', 'congo'],
      coordinates: { x: 380, y: 230 },
      resources: { food: 1 }
    },
    {
      id: 'egypt',
      name: 'Egypt',
      continent: 'africa',
      adjacent: ['north-africa', 'southern-europe', 'middle-east', 'east-africa'],
      coordinates: { x: 420, y: 220 },
      resources: { wealth: 1 }
    },
    {
      id: 'congo',
      name: 'Congo',
      continent: 'africa',
      adjacent: ['north-africa', 'east-africa', 'south-africa'],
      coordinates: { x: 410, y: 280 },
      resources: { production: 1, food: 1 }
    },
    {
      id: 'east-africa',
      name: 'East Africa',
      continent: 'africa',
      adjacent: ['north-africa', 'egypt', 'middle-east', 'madagascar', 'south-africa', 'congo'],
      coordinates: { x: 440, y: 270 },
      resources: { food: 2 }
    },
    {
      id: 'south-africa',
      name: 'South Africa',
      continent: 'africa',
      adjacent: ['congo', 'east-africa', 'madagascar'],
      coordinates: { x: 410, y: 330 },
      resources: { production: 2 }
    },
    {
      id: 'madagascar',
      name: 'Madagascar',
      continent: 'africa',
      adjacent: ['east-africa', 'south-africa'],
      coordinates: { x: 460, y: 320 },
      resources: { food: 1 }
    },
    
    // Asia
    {
      id: 'ural',
      name: 'Ural',
      continent: 'asia',
      adjacent: ['ukraine', 'siberia', 'afghanistan', 'china'],
      coordinates: { x: 500, y: 140 },
      resources: { production: 1 }
    },
    {
      id: 'siberia',
      name: 'Siberia',
      continent: 'asia',
      adjacent: ['ural', 'yakutsk', 'irkutsk', 'mongolia', 'china'],
      coordinates: { x: 550, y: 120 },
      resources: { production: 2 }
    },
    {
      id: 'yakutsk',
      name: 'Yakutsk',
      continent: 'asia',
      adjacent: ['siberia', 'kamchatka', 'irkutsk'],
      coordinates: { x: 590, y: 100 },
      resources: { production: 1 }
    },
    {
      id: 'kamchatka',
      name: 'Kamchatka',
      continent: 'asia',
      adjacent: ['yakutsk', 'irkutsk', 'mongolia', 'japan', 'alaska'],
      coordinates: { x: 640, y: 120 },
      resources: { production: 1 }
    },
    {
      id: 'irkutsk',
      name: 'Irkutsk',
      continent: 'asia',
      adjacent: ['siberia', 'yakutsk', 'kamchatka', 'mongolia'],
      coordinates: { x: 580, y: 150 },
      resources: { production: 1 }
    },
    {
      id: 'afghanistan',
      name: 'Afghanistan',
      continent: 'asia',
      adjacent: ['ukraine', 'ural', 'china', 'india', 'middle-east'],
      coordinates: { x: 490, y: 190 },
      resources: { food: 1 }
    },
    {
      id: 'middle-east',
      name: 'Middle East',
      continent: 'asia',
      adjacent: ['ukraine', 'southern-europe', 'egypt', 'east-africa', 'afghanistan', 'india'],
      coordinates: { x: 460, y: 210 },
      resources: { wealth: 3 }
    },
    {
      id: 'india',
      name: 'India',
      continent: 'asia',
      adjacent: ['middle-east', 'afghanistan', 'china', 'siam'],
      coordinates: { x: 520, y: 230 },
      resources: { food: 2, wealth: 1 }
    },
    {
      id: 'china',
      name: 'China',
      continent: 'asia',
      adjacent: ['ural', 'siberia', 'mongolia', 'siam', 'india', 'afghanistan'],
      coordinates: { x: 550, y: 200 },
      resources: { production: 2, food: 1 }
    },
    {
      id: 'mongolia',
      name: 'Mongolia',
      continent: 'asia',
      adjacent: ['siberia', 'irkutsk', 'kamchatka', 'japan', 'china'],
      coordinates: { x: 580, y: 180 },
      resources: { production: 1 }
    },
    {
      id: 'japan',
      name: 'Japan',
      continent: 'asia',
      adjacent: ['kamchatka', 'mongolia'],
      coordinates: { x: 620, y: 180 },
      resources: { wealth: 2, research: 1 }
    },
    {
      id: 'siam',
      name: 'Siam',
      continent: 'asia',
      adjacent: ['india', 'china', 'indonesia'],
      coordinates: { x: 550, y: 240 },
      resources: { food: 2 }
    },
    
    // Australia
    {
      id: 'indonesia',
      name: 'Indonesia',
      continent: 'australia',
      adjacent: ['siam', 'new-guinea', 'western-australia'],
      coordinates: { x: 580, y: 280 },
      resources: { food: 1 }
    },
    {
      id: 'new-guinea',
      name: 'New Guinea',
      continent: 'australia',
      adjacent: ['indonesia', 'western-australia', 'eastern-australia'],
      coordinates: { x: 640, y: 270 },
      resources: { food: 1 }
    },
    {
      id: 'western-australia',
      name: 'Western Australia',
      continent: 'australia',
      adjacent: ['indonesia', 'new-guinea', 'eastern-australia'],
      coordinates: { x: 600, y: 320 },
      resources: { production: 1 }
    },
    {
      id: 'eastern-australia',
      name: 'Eastern Australia',
      continent: 'australia',
      adjacent: ['western-australia', 'new-guinea'],
      coordinates: { x: 640, y: 320 },
      resources: { wealth: 1, research: 1 }
    }
  ]
};

export default classicMap;
