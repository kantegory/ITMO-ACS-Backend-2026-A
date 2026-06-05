package catalogrepo

type dishTypeRow struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null;size:100"`
}

func (dishTypeRow) TableName() string {
	return dishTypesTable
}

type difficultyRow struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"not null;size:100"`
}

func (difficultyRow) TableName() string {
	return difficultiesTable
}

type tagRow struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null;size:100"`
}

func (tagRow) TableName() string {
	return tagsTable
}

type ingredientRow struct {
	ID   uint64 `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex;not null;size:200"`
}

func (ingredientRow) TableName() string {
	return ingredientsTable
}

type measurementUnitRow struct {
	ID        uint64 `gorm:"primaryKey"`
	Name      string `gorm:"not null;size:100"`
	ShortName string `gorm:"not null;size:20"`
}

func (measurementUnitRow) TableName() string {
	return measurementUnitsTable
}
