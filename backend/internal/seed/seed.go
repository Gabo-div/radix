package seed

import (
	"context"

	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

func Data(ctx context.Context, s *store.Store) error {
	if err := s.AddUser(ctx, &models.User{ID: "u1", Name: "Prof. Carlos Mendoza", Role: models.RoleAdmin, Points: 0, CompletedLessons: nil}); err != nil {
		return err
	}
	// u2's completed lesson ("l1") gets attached after lessons are created below —
	// user_completed_lessons.lesson_id has a real FK now, can't reference it yet.
	u2 := &models.User{ID: "u2", Name: "Sofía Ramírez", Role: models.RoleStudent, Points: 150, CompletedLessons: nil}
	if err := s.AddUser(ctx, u2); err != nil {
		return err
	}
	if err := s.AddUser(ctx, &models.User{ID: "u3", Name: "Mateo Torres", Role: models.RoleStudent, Points: 80, CompletedLessons: nil}); err != nil {
		return err
	}

	lib1, err := s.AddLibraryItem(ctx, models.LibraryItem{Title: "Introducción a la Biología Celular", Type: "video", Category: "Ciencias Naturales", SizeKB: 45800})
	if err != nil {
		return err
	}
	lib2, err := s.AddLibraryItem(ctx, models.LibraryItem{Title: "Álgebra Lineal - Vectores", Type: "video", Category: "Matemáticas", SizeKB: 62300})
	if err != nil {
		return err
	}
	lib3, err := s.AddLibraryItem(ctx, models.LibraryItem{Title: "Podcast: Revolución Francesa", Type: "audio", Category: "Historia", SizeKB: 28400})
	if err != nil {
		return err
	}
	if _, err := s.AddLibraryItem(ctx, models.LibraryItem{Title: "Pronunciación del Inglés Técnico", Type: "audio", Category: "Idiomas", SizeKB: 15200}); err != nil {
		return err
	}
	if _, err := s.AddLibraryItem(ctx, models.LibraryItem{Title: "Análisis de 'Cien Años de Soledad'", Type: "document", Category: "Literatura", SizeKB: 3200}); err != nil {
		return err
	}
	if _, err := s.AddLibraryItem(ctx, models.LibraryItem{Title: "Manual de Laboratorio de Química", Type: "document", Category: "Ciencias Naturales", SizeKB: 8400}); err != nil {
		return err
	}

	c1 := &models.Course{Title: "Biología General", Description: "Introducción a los conceptos fundamentales de la biología moderna, desde la célula hasta los ecosistemas.", Category: "Ciencias Naturales"}
	if err := s.AddCourse(ctx, c1); err != nil {
		return err
	}
	c2 := &models.Course{Title: "Matemáticas Discretas", Description: "Fundamentos de lógica, conjuntos, relaciones y grafos para ciencias de la computación.", Category: "Matemáticas"}
	if err := s.AddCourse(ctx, c2); err != nil {
		return err
	}
	c3 := &models.Course{Title: "Historia Universal", Description: "Panorama de los eventos más importantes de la historia de la humanidad desde la antigüedad hasta la era contemporánea.", Category: "Historia"}
	if err := s.AddCourse(ctx, c3); err != nil {
		return err
	}

	l1 := &models.Lesson{CourseID: c1.ID, Title: "La Célula: Unidad Fundamental", ContentText: "La célula es la unidad básica estructural y funcional de todos los organismos vivos. Existen dos tipos principales: procariotas y eucariotas. Las células procariotas carecen de núcleo definido, mientras que las eucariotas poseen un núcleo rodeado por una membrana nuclear. La teoría celular, formulada en el siglo XIX, establece que todos los seres vivos están compuestos por células y que toda célula proviene de otra célula preexistente. Robert Hooke fue el primero en observar células en 1665 utilizando un microscopio primitivo.", LibraryItemID: &lib1}
	if err := s.AddLesson(ctx, l1); err != nil {
		return err
	}
	u2.CompletedLessons = []string{l1.ID}
	if err := s.UpdateUser(ctx, u2); err != nil {
		return err
	}
	if err := s.AddLesson(ctx, &models.Lesson{CourseID: c1.ID, Title: "Metabolismo y Energía Celular", ContentText: "El metabolismo celular comprende todas las reacciones químicas que ocurren dentro de la célula. Se divide en catabolismo (degradación de moléculas para obtener energía) y anabolismo (síntesis de moléculas complejas). La respiración celular, que ocurre en las mitocondrias, es el proceso mediante el cual las células convierten la glucosa en ATP, la moneda energética de la célula. La fotosíntesis, realizada por las plantas en los cloroplastos, convierte la energía lumínica en energía química almacenada en glucosa."}); err != nil {
		return err
	}
	l3 := &models.Lesson{CourseID: c2.ID, Title: "Lógica Proposicional", ContentText: "La lógica proposicional estudia las proposiciones y las conexiones lógicas entre ellas. Una proposición es una afirmación que puede ser verdadera o falsa. Los conectivos lógicos fundamentales incluyen: negación (¬), conjunción (∧), disyunción (∨), implicación (→) y bicondicional (↔). Las tablas de verdad son herramientas que permiten determinar el valor de verdad de una proposición compuesta para todas las combinaciones posibles de valores de verdad de sus proposiciones simples.", LibraryItemID: &lib2}
	if err := s.AddLesson(ctx, l3); err != nil {
		return err
	}
	if err := s.AddLesson(ctx, &models.Lesson{CourseID: c2.ID, Title: "Conjuntos y Operaciones", ContentText: "Un conjunto es una colección bien definida de objetos. Los conjuntos se denotan con llaves y sus elementos pueden ser números, letras u otros objetos. Las operaciones fundamentales entre conjuntos incluyen: unión (∪), intersección (∩), diferencia (−) y complemento. El producto cartesiano de dos conjuntos A y B es el conjunto de todos los pares ordenados (a, b) donde a ∈ A y b ∈ B."}); err != nil {
		return err
	}
	l5 := &models.Lesson{CourseID: c3.ID, Title: "La Revolución Francesa", ContentText: "La Revolución Francesa (1789-1799) fue un período de transformación social y política radical en Francia. Comenzó con la convocatoria de los Estados Generales por el rey Luis XVI y culminó con el ascenso de Napoleón Bonaparte. La Toma de la Bastilla el 14 de julio de 1789 es considerado el evento simbólico que marcó el inicio de la revolución. La Declaración de los Derechos del Hombre y del Ciudadano, aprobada en agosto de 1789, estableció los principios de libertad, igualdad y fraternidad que inspirarían movimientos democráticos en todo el mundo.", LibraryItemID: &lib3}
	if err := s.AddLesson(ctx, l5); err != nil {
		return err
	}
	if err := s.AddLesson(ctx, &models.Lesson{CourseID: c3.ID, Title: "La Era Napoleónica", ContentText: "Napoleón Bonaparte gobernó Francia desde 1799 hasta 1815. Estableció un imperio que dominó gran parte de Europa continental. Entre sus logros más duraderos se encuentra el Código Napoleónico, un sistema legal que influyó en los códigos civiles de muchos países. Sus campañas militares expandieron el imperio francés pero finalmente llevaron a su derrota en la Batalla de Waterloo en 1815. El Congreso de Viena reorganizó las fronteras europeas después de la caída de Napoleón, estableciendo un equilibrio de poder que duraría décadas."}); err != nil {
		return err
	}

	if err := s.AddQuiz(ctx, &models.Quiz{LessonID: l1.ID, Questions: []models.QuizQuestion{
		{Text: "¿Quién fue el primero en observar células utilizando un microscopio?", Options: []string{"Anton van Leeuwenhoek", "Robert Hooke", "Louis Pasteur", "Gregor Mendel"}, CorrectIndex: 1},
		{Text: "¿Cuál de las siguientes NO es una característica de las células procariotas?", Options: []string{"Carecen de núcleo definido", "Poseen pared celular", "Tienen mitocondrias", "Su ADN está disperso en el citoplasma"}, CorrectIndex: 2},
		{Text: "¿Qué establece la teoría celular?", Options: []string{"Todas las células tienen núcleo", "Los virus son células", "Toda célula proviene de otra preexistente", "Las células sólo existen en animales"}, CorrectIndex: 2},
	}}); err != nil {
		return err
	}
	if err := s.AddQuiz(ctx, &models.Quiz{LessonID: l3.ID, Questions: []models.QuizQuestion{
		{Text: "¿Cuál de los siguientes NO es un conectivo lógico fundamental?", Options: []string{"Conjunción (∧)", "Disyunción (∨)", "Multiplicación (×)", "Implicación (→)"}, CorrectIndex: 2},
		{Text: "¿Qué herramienta se utiliza para determinar el valor de verdad de una proposición compuesta?", Options: []string{"Diagrama de Venn", "Tabla de verdad", "Árbol de decisión", "Matriz booleana"}, CorrectIndex: 1},
		{Text: "Una proposición es...", Options: []string{"Una pregunta", "Una afirmación que puede ser verdadera o falsa", "Un comando", "Una expresión matemática"}, CorrectIndex: 1},
	}}); err != nil {
		return err
	}
	if err := s.AddQuiz(ctx, &models.Quiz{LessonID: l5.ID, Questions: []models.QuizQuestion{
		{Text: "¿En qué año comenzó la Revolución Francesa?", Options: []string{"1776", "1789", "1799", "1804"}, CorrectIndex: 1},
		{Text: "¿Qué documento estableció los principios de libertad, igualdad y fraternidad?", Options: []string{"La Constitución de 1791", "El Código Napoleónico", "La Declaración de los Derechos del Hombre y del Ciudadano", "La Carta Magna"}, CorrectIndex: 2},
		{Text: "¿Qué evento simbólico marcó el inicio de la Revolución Francesa?", Options: []string{"La ejecución de Luis XVI", "La Toma de la Bastilla", "El golpe de estado de Napoleón", "La firma del Tratado de Versalles"}, CorrectIndex: 1},
	}}); err != nil {
		return err
	}

	return nil
}
