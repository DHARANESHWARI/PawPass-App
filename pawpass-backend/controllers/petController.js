const Pet = require('../models/Pet');

// GET active pets only (Filters out soft-deleted pets)
exports.getPets = async (req, res) => {
  try {
    const pets = await Pet.find({ 
      owner: req.user.id, 
      isDeleted: { $ne: true } 
    });
    res.json(pets);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// ADD PET (This was missing and caused your TypeError crash)
exports.addPet = async (req, res) => {
  try {
    const newPet = new Pet({
      ...req.body,
      owner: req.user.id
    });
    const pet = await newPet.save();
    res.status(201).json(pet);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// SOFT DELETE: Hide from list, keep in DB for bookings
exports.deletePet = async (req, res) => {
  try {
    let pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ msg: "Pet not found" });
    if (pet.owner.toString() !== req.user.id) return res.status(401).json({ msg: "Unauthorized" });

    pet.isDeleted = true; 
    await pet.save();
    res.json({ msg: "Pet removed from list, history preserved" });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// UPDATE: Full edit capabilities
exports.updatePet = async (req, res) => {
  try {
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );
    res.json(updatedPet);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};