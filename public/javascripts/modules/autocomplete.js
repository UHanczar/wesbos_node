const autocomplete = (input, latInput, lngInput) => {
  if(!input) return;

  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
    console.log(latInput, lngInput);
  });

  // if someone hits enter it triggers form submitting. To prevent it we should fix preventDefault on enter
  input.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  });
};

export default autocomplete;