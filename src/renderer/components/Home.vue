<template>
	<el-container id="wrapper">
		<el-header style="padding-top: 20px;">
			<el-row>
				<el-button @click="sendCmd('login')" type="primary" plain size="small">登录京东</el-button>
				<el-button @click="sendCmd('start')" type="warning" plain size="small" :loading="fetchBtn.loading">{{fetchBtn.text}}</el-button>
				<el-button @click="initPage" type="success" plain size="small" :loading="loading">刷新列表</el-button>
			</el-row>
		</el-header>
		<el-main id="main">
			<el-table v-loading="loading" :data="tableData" style="width: 100%" stripe border highlight-current-row>
				<el-table-column type="expand">
					<template slot-scope="props">
						<el-form label-position="left" inline class="table-expand">
							<el-row :gutter="30">
								<el-col :span="8">
									<span class="item-title">任务信息</span>
									<el-form-item label="标题">
										<span>{{ props.row.assignmentTitle }}</span>
									</el-form-item><br />
									<el-form-item label="描述">
										<span>{{ props.row.assignmentContent }}</span>
									</el-form-item><br />
								</el-col>
								<el-col :span="8">
									<span class="item-title" style="visibility: hidden;">任务信息</span>
									<el-form-item label="投放渠道">
										<span>{{ props.row.subChannelNameList }}</span>
									</el-form-item><br />
									<el-form-item label="内容类型">
										<span>{{ props.row.contentTypesList }}</span>
									</el-form-item><br />
									<el-form-item label="发布时间">
										<span>{{ props.row.releaseTime | utc2local }}</span>
									</el-form-item><br />
									<el-form-item label="报名截止">
										<span>{{ props.row.registrationTime | utc2local }}</span>
									</el-form-item><br />
									<el-form-item label="任务完成">
										<span>{{ props.row.dueTime | utc2local }}</span>
									</el-form-item>
								</el-col>
								<el-col :span="8">
									<span class="item-title">商户信息</span>
									<el-form-item label="名称" v-show="props.row.shopName">
										<span>{{ props.row.shopName }}</span>
									</el-form-item><br />
									<el-form-item label="商户ID" v-show="props.row.shopId">
										<span>{{ props.row.shopId }}</span>
									</el-form-item><br />
									<el-form-item label="联系电话" v-show="props.row.shopPhone">
										<span>{{ props.row.shopPhone }}</span>
									</el-form-item><br />
									<el-form-item label="咚咚号" v-show="props.row.shopPIN">
										<span>{{ props.row.shopPIN }}</span>
									</el-form-item><br />
									<el-form-item label="主页" v-show="props.row.shopUrl">
										<el-button type="success" size="mini" plain @click="open(props.row.shopUrl)">点击浏览</el-button>
									</el-form-item><br />
								</el-col>
							</el-row>
						</el-form>
					</template>
				</el-table-column>
				<el-table-column label="任务 ID" prop="assignmentId">
				</el-table-column>
				<el-table-column label="标题" prop="assignmentTitle">
				</el-table-column>
				<el-table-column label="描述" prop="assignmentContent">
				</el-table-column>
				<el-table-column label="发布时间">
					<template slot-scope="scope">
						{{ scope.row.releaseTime | utc2local }}
					</template>
				</el-table-column>
				<el-table-column label="报名截止">
					<template slot-scope="scope">
						{{ scope.row.registrationTime | utc2local }}
					</template>
				</el-table-column>
			</el-table>

			<div style="text-align: center; padding: 20px 20px;">
				<el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" @current-change="getAssignments"
				 :current-page.sync="currentPage">
				</el-pagination>
			</div>
		</el-main>
		<el-backtop target="#main"></el-backtop>
	</el-container>
</template>

<script>
	export default {
		name: 'home',
		data() {
			let initialStatus = {
				text: '同步数据',
				loading: false
			}
			return {
				currentStatus: initialStatus,
				initialStatus: initialStatus,
				loadingStatus: {
					text: '同步中...',
					loading: true
				},
				loading: false,
				tableData: [],
				pageSize: 20,
				currentPage: 1,
				total: 0
			}
		},
		computed: {
			fetchBtn: {
				get() {
					return this.currentStatus
				},
				set(newVal) {
					this.currentStatus = newVal
				}
			}
		},
		created() {
			let that = this
			this.$electron.ipcRenderer.on('newdata', (evt, args) => {
				that.$message.success(`有${args}条数据，刷新列表后浏览`)
				// that.initPage()
			})
			this.initPage()
		},
		methods: {
			initPage() {
				this.currentPage = 1
				this.$http.get('count').then((resp) => {
					this.total = resp.data[0].no_of_rows
				})
				this.getAssignments()
			},
			getAssignments(page) {
				this.loading = true
				let that = this
				this.$http.get('/', {
					params: {
						_sort: '-assignmentId',
						_p: page - 1,
						_size: this.pageSize
					}
				}).then((resp) => {
					that.loading = false
					this.tableData = resp.data
				}).catch(function(error) {
					that.loading = false
					this.$message.error('错了哦，这是一条错误消息');
				})
			},
			sendCmd(cmd) {
				if (cmd == 'login') {

				} else if (cmd == 'start') {
					if (this.fetchBtn.loading) {
						this.sendCmd('stopSync')
						this.fetchBtn = this.initialStatus
					} else {
						this.sendCmd('startSync')
						this.fetchBtn = this.loadingStatus
					}
				}
				this.$electron.ipcRenderer.send(cmd)
			},
			open(link) {
				this.$electron.shell.openExternal(link)
			}
		}
	}
</script>

<style>
	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	body {
		font-family: 'Source Sans Pro', sans-serif;
	}

	#wrapper {
		background:
			radial-gradient(ellipse at top left,
			rgba(255, 255, 255, 1) 40%,
			rgba(229, 229, 229, .9) 100%);
		height: 100vh;
		width: 100vw;
	}

	.table-expand {
		font-size: 0;
	}

	.table-expand label {
		width: 90px;
		color: #99a9bf;
	}

	.table-expand .el-form-item {
		margin-right: 0;
		margin-bottom: 0;
		/* width: 50%; */
	}

	.table-expand .item-title {
		display: block;
		font-size: 13px;
		font-weight: bold;
		color: #333333;
	}
</style>
