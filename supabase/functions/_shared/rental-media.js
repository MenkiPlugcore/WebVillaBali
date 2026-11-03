export const rentalMediaKeys=Object.freeze(['rental_hero','tour_poster','driver_poster']);
const objectId='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const validRentalMediaPath=(key,path)=>rentalMediaKeys.includes(key)&&typeof path==='string'&&new RegExp('^site_media/'+key+'/'+objectId+'\\.(jpg|png|webp)$').test(path);
