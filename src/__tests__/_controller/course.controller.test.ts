import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import path from "path";
import supertest from "supertest";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { DocumentType, SubDocumentType } from "@typegoose/typegoose";

import { ContentType } from "../../_models/content.model";
import { Course, CourseClass, GroupClass } from "../../_models/course.model";
import { Lesson, LessonClass } from "../../_models/lesson.model";
import { UserClass } from "../../_models/user.model";
import { createUserService, updateUserService } from "../../_services/user.service";
import { connectToCloudinary } from "../../_utils/cloudinary.util";
import { CourseDifficulty, CourseStage } from "../../_utils/course.util";
import { UserRole } from "../../_utils/user.util";
import { app } from "../../api";

var userPayload = {
  fullName: "James Bond",
  username: "james_bond",
  email: "james@gmail.com",
  password: "testing",
  profileImage: {
    URL: "https://images.unsplash.com/photo-1628890923662-2cb23c2e0cfe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
  },
};

var coursePayload = {
  emoji: "📈",
  title: "Course 1",
  description: "Course 1 description",
  tags: ["fun", "javascript", "typescript"],
  faqs: [{ question: "what is this?", answer: "this is a course" }],
  difficulty: CourseDifficulty.INTERMEDIATE,
  stage: CourseStage.PUBLISHED,
};

function createGroup(label: string) {
  return {
    title: label,
    _id: new mongoose.Types.ObjectId(),
    lessons: [],
    lastEditedOn: new Date(Date.now()),
  };
}

describe.only("Course related controllers", () => {
  var user: DocumentType<UserClass>;
  var accessToken: string;
  var course: DocumentType<CourseClass>;
  var group: SubDocumentType<GroupClass>;
  var lesson: DocumentType<LessonClass>;

  // ============================
  // GLOBAL SETUP AND TEARDOWN
  // ============================

  // Initializing the in-memory database
  beforeAll(async function connectToMongoDB() {
    var mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await connectToCloudinary();
  });

  // Creating a user with the role of teacher
  beforeAll(async function createInstructor() {
    user = await createUserService({
      fullName: userPayload.fullName,
      username: userPayload.username,
      email: userPayload.email,
      roles: [UserRole.STUDENT, UserRole.TEACHER],
      profileImage: userPayload.profileImage,
    });
    accessToken = user.accessToken();
  });

  // Create a course
  beforeAll(async function createCourse() {
    course = new Course(coursePayload);
    course.instructors.push(user._id);

    await (async function IIFE() {
      var grp1 = createGroup("Group 1") as any;
      var grp2 = createGroup("Group 2") as any;
      course.groups.push(grp1);
      course.groups.push(grp2);
      await course.save();
      group = grp1;
    })();

    // Create lessons and update course
    await (async function IIFE() {
      lesson = new Lesson({
        emoji: "🌍",
        title: "Lesson 1",
        video: { URL: "https://www.youtube.com/watch?v=KQia57Mw6aA" },
      });

      var lesson2 = new Lesson();
      await lesson2.save();

      var idx = course.groups.findIndex((g) => g._id == group._id);
      var grp = course.groups[idx];
      grp.lessons.push(lesson._id);
      grp.lessons.push(lesson2._id);
      course.groups[idx] = grp;
    })();

    await course.save();
    await lesson.save();
  });

  // Disconnecting from the in-memory database
  afterAll(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  describe("create a course", () => {
    describe("instructor is creating a course", () => {
      it("should create and return a course", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/course")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(201);
        expect(body).toHaveProperty("course");
        expect(body.course).toHaveProperty("instructors");
        expect(body.course.instructors).toHaveLength(1);
        expect(body.course.instructors[0]).toBe(user._id.toString());
        expect(body.course).toHaveProperty("_id");
      });
    });
  });

  describe("fetch a single course", () => {
    describe("when a course does not exists", () => {
      it("should return course not found with 404", async () => {
        var invalidCourseId = new mongoose.Types.ObjectId();
        var { status, body } = await supertest(app).get(
          `/api/v2/course/${invalidCourseId}`
        );

        expect(status).toBe(404);
        expect(body).toEqual({ message: "Course not found" });
      });
    });

    describe("when the course exists", () => {
      it("should return the course containing required data", async () => {
        var { status, body } = await supertest(app).get(
          `/api/v2/course/${course._id}`
        );

        expect(status).toBe(200);
        expect(body).toBeDefined();
        expect(body.course).toBeDefined();

        (function testCourseBasicInfo(checkCourse) {
          expect(checkCourse).toMatchObject({
            _id: course._id.toString(),
            emoji: course.emoji,
            title: course.title,
            description: course.description,
            stage: course.stage,
            instructors: expect.any(Array),
            difficulty: course.difficulty,
            groups: expect.any(Array),
            tags: course.tags,
            faqs: course.faqs,
            enrolled: course.enrolled,
            ratings: course.ratings,
            createdAt: (course as any).createdAt.toISOString(),
            updatedAt: (course as any).updatedAt.toISOString(),
            lastEditedOn: (course as any).lastEditedOn.toISOString(),
          });
        })(body.course);

        (function testCourseInstructors(instructors) {
          expect(instructors).toHaveLength(1);
          expect(instructors[0]).toMatchObject({
            _id: user._id.toString(),
            fullName: user.fullName,
            username: user.username,
            profileImage: { URL: user.profileImage.URL },
            email: user.email,
          });
        })(body.course.instructors);

        (function testCourseGroups(groups) {
          expect(groups).toHaveLength(2);
          expect(groups[0]).toMatchObject({
            _id: group._id.toString(),
            title: group.title,
            lessons: expect.any(Array),
            lastEditedOn: group.lastEditedOn.toISOString(),
          });
        })(body.course.groups);

        (function testCourseLessons(lessons) {
          expect(lessons).toHaveLength(2);
          expect(lessons[0]).toMatchObject({
            _id: lesson._id.toString(),
            title: lesson.title,
            // video: { URL: lesson.video.URL },
            videoDuration: lesson.videoDuration,
            createdAt: (lesson as any).createdAt.toISOString(),
            updatedAt: (lesson as any).updatedAt.toISOString(),
          });
        })(body.course.groups[0].lessons);
      });
    });
  });

  describe("fetching paginated courses", () => {
    it("should return limited courses", async () => {
      var { status, body } = await supertest(app).get("/api/v2/course");

      expect(status).toBe(200);
      expect(body).toBeDefined();
      expect(body.hasPrevious).toBe(false);
      expect(body.hasNext).toBe(false);
      expect(body.next).toBeDefined();
      expect(body.courses).toBeDefined();
      expect(body.courses).toBeInstanceOf(Array);

      (function testCourseBasicInfo(checkCourse) {
        expect(checkCourse).toMatchObject({
          _id: course._id.toString(),
          emoji: course.emoji,
          title: course.title,
          description: course.description,
          stage: course.stage,
          instructors: expect.any(Array),
          difficulty: course.difficulty,
          groups: expect.any(Array),
          tags: course.tags,
          faqs: course.faqs,
          enrolled: course.enrolled,
          ratings: course.ratings,
          createdAt: (course as any).createdAt.toISOString(),
          updatedAt: (course as any).updatedAt.toISOString(),
          lastEditedOn: (course as any).lastEditedOn.toISOString(),
        });
      })(body.courses[0]);

      (function testCourseInstructors(instructors) {
        expect(instructors).toHaveLength(1);
        expect(instructors[0]).toMatchObject({
          _id: user._id.toString(),
          fullName: user.fullName,
          username: user.username,
          profileImage: { URL: user.profileImage.URL },
          email: user.email,
        });
      })(body.courses[0].instructors);

      (function testCourseGroups(groups) {
        expect(groups).toHaveLength(2);
        expect(groups[0]).toMatchObject({
          _id: group._id.toString(),
          title: group.title,
          lessons: expect.any(Array),
          lastEditedOn: group.lastEditedOn.toISOString(),
        });
      })(body.courses[0].groups);

      (function testCourseLessons(lessons) {
        expect(lessons).toHaveLength(2);
        expect(lessons[0]).toMatchObject({
          _id: lesson._id.toString(),
          title: lesson.title,
          // video: { URL: lesson.video.URL },
          videoDuration: lesson.videoDuration,
          createdAt: (lesson as any).createdAt.toISOString(),
          updatedAt: (lesson as any).updatedAt.toISOString(),
        });
      })(body.courses[0].groups[0].lessons);
    });
  });
});

describe.skip("Course controllers", () => {
  var user: DocumentType<UserClass>;
  var token: string;

  beforeAll(async function connectToMongoDB() {
    var mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await connectToCloudinary();
  });

  beforeAll(async function deleteUser() {
    user = await createUserService({
      email: userPayload.email,
      roles: [UserRole.STUDENT, UserRole.TEACHER],
    });
    token = user.accessToken();
  });

  afterAll(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  describe("createCourse", () => {
    describe("given that user is not a teacher", () => {
      it("should return forbidden", async () => {
        // Remove teacher role
        await updateUserService(user._id, { roles: [UserRole.STUDENT] });

        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(403);
        expect(body).toEqual({ message: "Forbidden" });

        // Add back teacher role
        await updateUserService(user._id, {
          roles: [UserRole.STUDENT, UserRole.TEACHER],
        });
      });
    });

    describe("given that the user is a teacher", () => {
      it("should create a course", async () => {
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(201);
        expect(body.course).toHaveProperty("_id");
        expect(body.course).toHaveProperty("lastEditedOn");
        expect(body).toMatchObject({
          course: {
            stage: "draft",
            difficulty: "beginner",
            instructors: [user._id.toString()],
            tags: [],
            faqs: [],
            groups: [],
            enrolled: 0,
            ratings: 0,
          },
        });
      });
    });
  });

  describe("updateSettings", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the instructor is updating the course", () => {
      it("should update the course (without cover image)", async () => {
        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/settings`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            emoji: "👍",
            title: "Test title",
            description: "Test description",
            stage: "published",
            price: 300,
            difficulty: "intermediate",
            tags: ["test", "tags"],
            faqs: [{ question: "Test question", answer: "Test answer" }],
          });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          course: {
            emoji: "👍",
            title: "Test title",
            description: "Test description",
            stage: "published",
            price: 300,
            difficulty: "intermediate",
            tags: ["test", "tags"],
            faqs: [{ question: "Test question", answer: "Test answer" }],
          },
        });
      });
    });
  });

  // Skipping this test because it upload image to the cloudinary
  describe.skip("updateCoverImageController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the instructor is updating the course", () => {
      it("update course cover image", async () => {
        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/cover`)
          .set("Authorization", `Bearer ${token}`)
          .attach(
            "coverImage",
            path.resolve(__dirname, "../../../media/cover-image.jpg")
          );

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          image: { id: expect.any(String), URL: expect.any(String) },
        });
      }, 30000);
    });
  });

  // ============================
  // GROUP
  // ============================

  describe("createGroupController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the instructor is creating a group", () => {
      it("should create a group", async () => {
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course/${course._id}/group`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({ group: { lessons: [] } });
      });
    });

    describe("given that the lesson doesn't exists", () => {
      it("should return Forbidden message", async () => {
        var invalidId = new mongoose.Types.ObjectId();
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course/${invalidId}/group`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(403);
        expect(body).toMatchObject({ message: "Forbidden" });
      });
    });
  });

  describe("updateGroupController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that course settings is updated", () => {
      it("should update the course", async () => {
        var group = {
          _id: new mongoose.Types.ObjectId(),
          lessons: [],
          lastEditedOn: new Date(Date.now()),
        };
        course.groups.push(group as any);
        await course.save();

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/group/${group._id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            emoji: "👍",
            title: "Test title",
            description: "Test description",
          });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          group: {
            emoji: "👍",
            title: "Test title",
            description: "Test description",
          },
        });
      });
    });
  });

  describe("reorderLessonsController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the new order is sent", () => {
      it("should update the order of the lessons", async () => {
        var lesson1 = new mongoose.Types.ObjectId();
        var lesson2 = new mongoose.Types.ObjectId();
        var lesson3 = new mongoose.Types.ObjectId();
        var lesson4 = new mongoose.Types.ObjectId();

        var group = {
          _id: new mongoose.Types.ObjectId(),
          lessons: [lesson1, lesson2, lesson3, lesson4],
          lastEditedOn: new Date(Date.now()),
        };
        course.groups.push(group as any);
        await course.save();

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/group/${group._id}/reorder`)
          .set("Authorization", `Bearer ${token}`)
          .send({ lessons: [lesson3, lesson2, lesson1, lesson4] });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          group: {
            lessons: [lesson3, lesson2, lesson1, lesson4],
          },
        });
      });
    });
  });

  // ============================
  // LESSON
  // ============================

  describe("createLessonController", () => {
    var course: DocumentType<CourseClass>;
    var groupId = new mongoose.Types.ObjectId();

    beforeAll(async () => {
      course = new Course({
        groups: [
          {
            _id: groupId,
            lessons: [],
            lastEditedOn: new Date(Date.now()),
          },
        ],
      });
      course.instructors.push(user._id);
      await course.save();
    });

    // MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
    describe.skip("given that the instructor is creating a lesson", () => {
      it("should create a lesson", async () => {
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course/${course._id}/group/${groupId}/lesson`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({ lesson: { content: [] } });
      });
    });
  });

  describe.only("Content", () => {
    var course: DocumentType<CourseClass>;
    var lesson: DocumentType<LessonClass>;
    var groupId: mongoose.Types.ObjectId;

    var paragraphId: string;
    var imageId: string;

    beforeAll(async () => {
      // Create course and groups
      course = new Course();
      course.instructors.push(user._id);
      var grp1 = createGroup("Group 1") as any;
      groupId = grp1._id;
      var grp2 = createGroup("Group 2") as any;
      course.groups.push(grp1);
      course.groups.push(grp2);
      await course.save();

      // Create lessons and update course
      lesson = new Lesson();
      var lesson2 = new Lesson();
      var idx = course.groups.findIndex((g) => g._id == grp1._id);
      var grp = course.groups[idx];
      grp.lessons.push(lesson._id);
      grp.lessons.push(lesson2._id);
      course.groups[idx] = grp;

      // TODO: have a transaction here
      await course.save();
      await lesson.save();
      await lesson2.save();
    });

    describe("add content", () => {
      describe("given a paragraph type", () => {
        it("should add paragraph", async () => {
          var { statusCode, body } = await supertest(app)
            .post(
              `/api/v2/course/${course._id}/group/${groupId}/lesson/${lesson._id}/content`
            )
            .set("Authorization", `Bearer ${token}`)
            .send({ type: ContentType.PARAGRAPH });

          expect(statusCode).toBe(201);
          expect(body).toMatchObject({
            content: {
              id: expect.any(String),
              type: ContentType.PARAGRAPH,
              data: expect.any(Array),
            },
          });

          var updatedLesson = await Lesson.findById(lesson._id);
          expect(updatedLesson?.content).toHaveLength(1);
          expect(updatedLesson?.content[0].type).toBe(ContentType.PARAGRAPH);
          expect(updatedLesson?.content[0].id).toBe(body.content.id);

          paragraphId = body.content.id;
        });
      });

      describe("given a image type", () => {
        it("should add image", async () => {
          var { statusCode, body } = await supertest(app)
            .post(
              `/api/v2/course/${course._id}/group/${groupId}/lesson/${lesson._id}/content`
            )
            .set("Authorization", `Bearer ${token}`)
            .send({ type: ContentType.IMAGE });

          expect(statusCode).toBe(201);
          expect(body).toMatchObject({
            content: {
              id: expect.any(String),
              type: ContentType.IMAGE,
              data: expect.any(Array),
            },
          });

          var updatedLesson = await Lesson.findById(lesson._id);
          var content = updatedLesson.content.find(
            (c) => c.id == body.content.id
          );

          expect(content.type).toBe(ContentType.IMAGE);
          expect(content.id).toBe(body.content.id);

          imageId = content.id;
        });
      });
    });

    describe("update content", () => {
      describe("given a paragraph to update", () => {
        it("should update paragraph", async () => {
          var { statusCode, body } = await supertest(app)
            .put(
              `/api/v2/course/${course._id}/group/${groupId}/lesson/${lesson._id}/content/${paragraphId}`
            )
            .set("Authorization", `Bearer ${token}`)
            .send({
              id: paragraphId,
              type: ContentType.PARAGRAPH,
              data: [{ key: "text", value: "Test paragraph" }],
            });

          expect(statusCode).toBe(200);
          expect(body).toMatchObject({
            content: {
              id: expect.any(String),
              type: ContentType.PARAGRAPH,
              data: expect.any(Array),
            },
          });

          var text = body.content.data.find((d) => d.key == "text");
          expect(text).toBeDefined();
          expect(text.value).toBe("Test paragraph");

          var updatedLesson = await Lesson.findById(lesson._id);
          var updatedParagraph = updatedLesson?.content.find(
            (c) => c.id == paragraphId
          );

          expect(updatedParagraph).toBeDefined();
          expect(
            updatedParagraph?.data.find((d) => d.key == "text").value
          ).toBe("Test paragraph");
        });
      });

      describe.skip("given a image to update", () => {
        it("should update image", async () => {
          var { statusCode, body } = await supertest(app)
            .put(
              `/api/v2/course/${course._id}/group/${groupId}/lesson/${lesson._id}/content/${imageId}`
            )
            .set("Authorization", `Bearer ${token}`)
            .field("id", imageId)
            .field("type", ContentType.IMAGE)
            .field("caption", "Test caption")
            .field(
              "data",
              JSON.stringify([
                { key: "URL", value: null },
                { key: "id", value: null },
                { key: "caption", value: null },
              ])
            )
            .attach(
              "contentImage",
              path.resolve(__dirname, "../../../media/cover-image.jpg")
            );

          expect(statusCode).toBe(200);
          expect(body).toMatchObject({
            content: {
              id: imageId,
              type: ContentType.IMAGE,
              data: expect.any(Array),
            },
          });

          expect(
            body.content.data.find((d) => d.key == "id").value
          ).toBeDefined();

          var updatedLesson = await Lesson.findById(lesson._id);
          var updateImage = updatedLesson?.content.find((c) => c.id == imageId);

          expect(updateImage).toBeDefined();
          expect(updateImage?.data.find((d) => d.key == "id").value).toBe(
            body.content.data.find((d) => d.key == "id").value
          );
          expect(updateImage?.data.find((d) => d.key == "caption").value).toBe(
            body.content.data.find((d) => d.key == "caption").value
          );
          expect(
            updateImage?.data.find((d) => d.key == "caption").value
          ).toBeDefined();
        }, 100000);
      });

      describe("given a course is requested", () => {
        it("should return the course", async () => {
          var { statusCode, body } = await supertest(app).get(
            `/api/v2/course/${course._id}`
          );

          expect(statusCode).toBe(200);
          console.log(body.course.groups[0]);
        });
      });

      describe("given courses are requested", () => {
        it("should return courses", async () => {
          var { statusCode, body } = await supertest(app).get(`/api/v2/course`);

          expect(statusCode).toBe(200);
          console.log(body.courses);
        });
      });
    });
  });
});
