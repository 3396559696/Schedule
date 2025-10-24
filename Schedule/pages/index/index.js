var app = getApp()
Page({
  data: {
    showClearDialog: false,
    colorArrays: ["#85B8CF", "#90C652", "#D8AA5A", "#FC9F9D", "#0AA984", "#61BC69", "#12AEF3", "#E29AAD"],
    courseColorMap: {}, // *存储课程名→颜色的映射
    isSingleWeek: true,
    week1List: [
      { id: 1, xqj: 1, skjc: 1, kcmc: "高等数学@教A-301" },
      { id: 2, xqj: 2, skjc: 7, kcmc: "线性代数@教B-202" },
      { id: 3, xqj: 3, skjc: 4, kcmc: "英语听说@语A-201" },
    ],
    week2List: [
      { id: 1, xqj: 1, skjc: 1, kcmc: "高等数学@教A-301" },
      { id: 2, xqj: 2, skjc: 2, kcmc: "线性代数@教B-202" },
      { id: 3, xqj: 3, skjc: 3, kcmc: "英语听说@语A-201" },
    ],
    currentList: [],
    coursePool: [
      { id: 101, kcmc: "高等数学@教A-301" },
      { id: 102, kcmc: "线性代数@教B-202" },
      { id: 103, kcmc: "英语听说@语A-201" }
    ],
    showCoursePool: false,
    selectedCourse: null,
    showAddDialog: false,
    newCourseName: '',
    isDraggingTableCourse: false,
    draggingTableCourse: null,
    dropPosition: null
  },

  // 页面加载：初始化颜色映射 + 加载数据
  onLoad() {
    this.initCourseColorMap(); // 初始化课程颜色映射
    this.loadDataFromStorage();
    this.setData({
      currentList: this.data.isSingleWeek ? this.data.week1List : this.data.week2List
    });
  },

  // 初始化课程颜色映射
  initCourseColorMap() {
    try {
      // 1. 从本地存储读取已有的颜色映射
      const storedColorMap = wx.getStorageSync('courseColorMap');
      if (storedColorMap) {
        this.setData({ courseColorMap: storedColorMap });
        // console.log('加载本地课程颜色映射成功');
        return;
      }

      // 2. 无本地映射：给所有默认课程分配初始颜色（去重）
      const allCourseNames = [
        ...this.data.week1List,
        ...this.data.week2List,
        ...this.data.coursePool
      ].map(item => item.kcmc).filter((name, index, self) => self.indexOf(name) === index); // 去重课程名

      const colorMap = {};
      allCourseNames.forEach(name => {
        colorMap[name] = this.getRandomUniqueColor();
      });

      this.setData({ courseColorMap: colorMap });
      wx.setStorageSync('courseColorMap', colorMap); // 保存到本地
      // console.log('初始化课程颜色映射成功');
    } catch (e) {
      console.error('初始化颜色映射失败：', e);
    }
  },

  // 工具方法生成随机且不重复的颜色
  getRandomUniqueColor() {
    const { colorArrays, courseColorMap } = this.data;
    const usedColors = Object.values(courseColorMap); // 已使用的颜色

    // 1. 优先使用默认颜色池中的未使用颜色
    const unusedDefaultColors = colorArrays.filter(color => !usedColors.includes(color));
    if (unusedDefaultColors.length > 0) {
      return unusedDefaultColors[Math.floor(Math.random() * unusedDefaultColors.length)];
    }

    // 2. 默认颜色池用完：生成随机RGB颜色
    let randomColor;
    do {
      const r = Math.floor(Math.random() * 150 + 50); // 50-200（避免过黑/过白）
      const g = Math.floor(Math.random() * 150 + 50);
      const b = Math.floor(Math.random() * 150 + 50);
      randomColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } while (usedColors.includes(randomColor)); // 确保不重复

    return randomColor;
  },

  // 读取本地存储（加载颜色映射）
  loadDataFromStorage() {
    try {
      const storedData = wx.getStorageSync('timetableData');
      const storedColorMap = wx.getStorageSync('courseColorMap');
      
      if (storedData) {
        this.setData({
          week1List: storedData.week1List || this.data.week1List,
          week2List: storedData.week2List || this.data.week2List,
          coursePool: storedData.coursePool || this.data.coursePool,
          isSingleWeek: storedData.isSingleWeek !== undefined ? storedData.isSingleWeek : this.data.isSingleWeek
        });
        // console.log('加载本地课程数据成功');
      }

      if (storedColorMap) {
        this.setData({ courseColorMap: storedColorMap });
        // console.log('加载本地颜色映射成功');
      }
    } catch (e) {
      console.error('加载本地数据失败：', e);
    }
  },

  // 保存本地存储（保存颜色映射）
  saveDataToStorage() {
    try {
      const dataToSave = {
        week1List: this.data.week1List,
        week2List: this.data.week2List,
        coursePool: this.data.coursePool,
        isSingleWeek: this.data.isSingleWeek
      };
      wx.setStorageSync('timetableData', dataToSave);
      wx.setStorageSync('courseColorMap', this.data.courseColorMap); // 单独保存颜色映射
      // console.log('课程数据+颜色映射保存成功');
    } catch (e) {
      console.error('保存数据失败：', e);
      wx.showToast({ title: '数据保存失败', icon: 'none' });
    }
  },

  // 新建课程（新增课程时分配颜色）
  confirmAddCourse() {
    const courseName = this.data.newCourseName.trim();
    if (!courseName) return;

    const { courseColorMap, coursePool } = this.data;
    const newColorMap = { ...courseColorMap };

    // 课程不存在：生成新颜色；存在：复用已有颜色
    if (!newColorMap[courseName]) {
      newColorMap[courseName] = this.getRandomUniqueColor();
    }

    // 添加到课程池
    const newCourse = { id: Date.now(), kcmc: courseName };
    this.setData({
      coursePool: [...coursePool, newCourse],
      courseColorMap: newColorMap,
      showAddDialog: false,
      newCourseName: ''
    });

    this.saveDataToStorage();
    wx.showToast({ title: '课程已添加到课程池' });
  },
    // 检查单双周
  toggleWeek() {
    const isSingle = !this.data.isSingleWeek;
    this.setData({
      isSingleWeek: isSingle,
      currentList: isSingle ? this.data.week1List : this.data.week2List
    });
    this.saveDataToStorage();
  },

  addCourseToTable(e) {
    const { selectedCourse } = this.data;
    if (!selectedCourse) {
      wx.showToast({ title: '请先在课程池选中课程', icon: 'none' });
      return;
    }

    const xqj = parseInt(e.currentTarget.dataset.xqj);
    const skjc = parseInt(e.currentTarget.dataset.skjc);
    const targetList = this.data.isSingleWeek ? 'week1List' : 'week2List';

    // 检查位置是否已有课程
    const hasCourse = this.data[targetList].some(item => item.xqj === xqj && item.skjc === skjc);
    if (hasCourse) {
      wx.showToast({ title: '该位置已有课程', icon: 'none' });
      return;
    }

    // 添加新课程（自动复用颜色）
    const newCourse = {
      id: Date.now(),
      xqj,
      skjc,
      kcmc: selectedCourse.kcmc
    };

    const updatedList = [...this.data[targetList], newCourse];
    this.setData({
      [targetList]: updatedList,
      currentList: updatedList
    });

    this.saveDataToStorage();
    wx.showToast({ title: '课程添加成功' });
  },

  handleDragEnd() {
    if (!this.data.isDraggingTableCourse) return;

    const { dropPosition, draggingTableCourse } = this.data;
    const targetList = this.data.isSingleWeek ? 'week1List' : 'week2List';

    if (dropPosition === 'delete') {
      const updatedList = this.data[targetList].filter(item => item.id !== draggingTableCourse.id);
      this.setData({
        [targetList]: updatedList,
        currentList: updatedList
      });
      this.saveDataToStorage();
      wx.showToast({ title: '课程已删除' });
    }

    this.setData({
      isDraggingTableCourse: false,
      draggingTableCourse: null,
      dropPosition: null
    });
  },

  deleteFromPool(e) {
    const courseId = e.currentTarget.dataset.id;
    const updatedPool = this.data.coursePool.filter(item => item.id !== courseId);
    this.setData({
      coursePool: updatedPool,
      selectedCourse: this.data.selectedCourse?.id === courseId ? null : this.data.selectedCourse
    });
    this.saveDataToStorage();
    wx.showToast({ title: '课程已从课程池删除' });
  },

  toggleCoursePool() {
    this.setData({ showCoursePool: !this.data.showCoursePool });
  },

  selectCourse(e) {
    const courseId = e.currentTarget.dataset.id;
    const selected = this.data.coursePool.find(item => item.id === courseId);
    this.setData({ selectedCourse: selected });
    wx.showToast({ title: `选中课程：${selected.kcmc}` });
  },

  startDragFromTable(e) {
    const courseId = e.currentTarget.dataset.id;
    const targetList = this.data.isSingleWeek ? 'week1List' : 'week2List';
    const course = this.data[targetList].find(item => item.id === courseId);
    this.setData({
      isDraggingTableCourse: true,
      draggingTableCourse: course
    });
  },

  handleDragMove(e) {
    if (!this.data.isDraggingTableCourse) return;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const deleteArea = wx.createSelectorQuery().select('.delete-area');
    deleteArea.boundingClientRect(rect => {
      if (rect && x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
        this.setData({ dropPosition: 'delete' });
      } else {
        this.setData({ dropPosition: null });
      }
    }).exec();
  },

  showAddCourseDialog() {
    this.setData({ showAddDialog: true, newCourseName: '' });
  },

  cancelAddCourse() {
    this.setData({ showAddDialog: false });
  },

  onCourseNameInput(e) {
    this.setData({ newCourseName: e.detail.value });
  },
showClearConfirm() {
  this.setData({ showClearDialog: true });
},

cancelClear() {
  this.setData({ showClearDialog: false });
},
// 确认清空所有数据
confirmClear() {
  // 1. 重置所有数据（课表、课程池、颜色映射）
  this.setData({
    week1List: [], // 清空单周课表
    week2List: [], // 清空双周课表
    currentList: [], // 清空当前显示的课表
    coursePool: [], // 清空课程池
    courseColorMap: {}, // 清空颜色映射
    selectedCourse: null, // 重置选中课程
    showClearDialog: false // 关闭弹窗
  });

  // 2. 清空本地存储（确保下次打开也是空数据）
  try {
    wx.removeStorageSync('timetableData'); // 删除课表数据
    wx.removeStorageSync('courseColorMap'); // 删除颜色映射
    console.log('所有数据已清空');
    wx.showToast({ title: '已清空请重新进入' });
  } catch (e) {
    console.error('清空数据失败：', e);
    wx.showToast({ title: '清空失败，请重试', icon: 'none' });
  }
}
});