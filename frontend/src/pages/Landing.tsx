import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const SECTION_PY = { xs: 5, sm: 6, md: 8 };
const CONTAINER_PX = { xs: 2, sm: 3 };

const Landing: React.FC = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header — компактный на мобиле, удобные зоны нажатия */}
      <Box
        component="header"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
          <Box
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Toratau"
                sx={{
                  width: { xs: 36, sm: 32 },
                  height: { xs: 36, sm: 32 },
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 700, letterSpacing: 0.3, fontSize: { xs: '1.1rem', sm: 'inherit' } }}
                >
                  Toratau
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Управление объектами
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="text"
                color="inherit"
                href="/login"
                sx={{
                  minHeight: { xs: 44, sm: 36 },
                  px: { xs: 1.5, sm: 1 },
                  fontSize: { xs: '0.95rem', sm: 'inherit' },
                }}
              >
                Войти
              </Button>
              <Button
                variant="contained"
                color="primary"
                href="/register"
                sx={{
                  minHeight: { xs: 44, sm: 36 },
                  px: { xs: 2, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: 'inherit' },
                }}
              >
                Зарегистрироваться
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* HERO */}
        <Box
          component="section"
          sx={{
            pt: { xs: 4, sm: 6, md: 10 },
            pb: { xs: 4, sm: 6, md: 10 },
            bgcolor:
              theme.palette.mode === 'light'
                ? 'grey.50'
                : theme.palette.background.default,
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 4, sm: 4, md: 6 }} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={{ xs: 2.5, sm: 3 }}>
                  <Chip
                    label="Хотите знать сколько потратили на объекте?"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />

                  <Typography
                    variant={isMdUp ? 'h3' : 'h4'}
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.15,
                      fontSize: { xs: '1.65rem', sm: '2rem', md: 'inherit' },
                    }}
                  >
                    Простая программа для управления строительной компании
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      maxWidth: 520,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    Вы открываете объект — и за 10 секунд понимаете ситуацию
                    <br />
                    Прорабы фиксируют выполненные работы за 30 секунд
                    <br />
                    Начните видеть реальную прибыль уже сегодня
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ '& .MuiButton-root': { minHeight: isMobile ? 48 : 42 } }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      href="/register"
                      endIcon={<ArrowForwardIcon />}
                      fullWidth={isMobile}
                    >
                      Попробовать бесплатно
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      href="/login"
                      fullWidth={isMobile}
                    >
                      Войти
                    </Button>
                  </Stack>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ maxWidth: 320, display: 'block' }}
                  >
                    14 дней бесплатно, тарифные планы от 1500 рублей/месяц
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: { xs: 2, md: 3 },
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: theme.palette.mode === 'light' ? '1px solid' : undefined,
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="img"
                    src="/dashboard-preview.png"
                    alt="Пример дашборда Toratau — сводка по объекту, финансы, бюджет"
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ПРОБЛЕМА */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  ПРОБЛЕМА
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Нет понимания и прозрачности реального движения денег по объектам
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                  Без единой картины по объектам и бригадам до 5–15% бюджета
                  уходит в неучтённый перерасход, споры по выплатам и «потерянные»
                  объёмы. Вы узнаёте о проблеме постфактум — когда терять уже нечего.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={2}>
                  {[
                    {
                      title: 'Кто сколько сделал — в чатах и таблицах',
                      text: 'Объёмы по бригадам размазаны по Excel и перепискам. Свести в одну картину и увидеть перерасход вовремя невозможно.',
                    },
                    {
                      title: 'План-факт узнаёте, когда уже поздно',
                      text: 'Отклонения всплывают в конце этапа или при конфликте. Решения принимаются по ощущениям, а не по цифрам.',
                    },
                    {
                      title: 'Споры по выплатам и «забытые» объёмы',
                      text: 'Бригады и прорабы помнят по-разному. Нет единой базы работ и начислений — только претензии и задержки.',
                    },
                    {
                      title: 'Несколько объектов — хаос в отчётности',
                      text: 'Сводки собираются вручную, ошибки копятся. Руководитель не видит, где реально теряются деньги.',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.title}>
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderStyle: 'dashed' }}>
                        <CardContent sx={{ p: { xs: 2.5, sm: 2 } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: 'inherit' } }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ПРОБЛЕМА С ПРОРАБАМИ */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Stack spacing={1} sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                ПРОБЛЕМА С ПРОРАБАМИ
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Прорабы не хотят заполнять документы — и это убивает внедрение
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.6 }}>
                Им мешают страх контроля, отсутствие личной выгоды, нежелание тратить время и привычка к хаосу.
                Если система усложняет жизнь прораба — она не приживётся. Нужно дать владельцу контроль и одновременно — выгоду прорабу.
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                  Почему прорабы саботируют отчётность
                </Typography>
                <Stack component="ul" spacing={1} sx={{ pl: 2.5, m: 0, '& li': { fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.5 } }}>
                  <li>Боятся контроля и что вскроются перерасходы</li>
                  <li>Не видят личной выгоды от заполнения</li>
                  <li>Не хотят тратить время на «бумажки»</li>
                  <li>Привыкли к хаосу и работе «в голове»</li>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                  Почему они будут использовать Toratau
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                  Всё заполнение — в несколько кнопок, всегда под рукой: быстрее мессенджеров, проще Excel, выгоднее учёта «в голове».
                </Typography>
                <Stack spacing={1}>
                  {[
                    'Быстрый расчёт зарплаты и прозрачный учёт бонусов',
                    'Защита от обвинений: фотофиксация как доказательство',
                    'Упрощённая отчётность — минимум действий, максимум ясности',
                  ].map((item) => (
                    <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ФУНКЦИОНАЛ — подробно */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'background.default' : 'grey.900',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Stack spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                ФУНКЦИОНАЛ
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Что умеет Toratau: полный цикл по объекту и бригадам
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620, lineHeight: 1.6 }}>
                От создания объекта и справочника расценок до учёта работ, начислений,
                выплат и отчётов — всё в одном месте. Ниже кратко по возможностям системы.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {[
                {
                  title: 'Объекты и сводка',
                  text: 'Создаёте объекты с датами старта и сдачи, плановой себестоимостью и суммой контракта. По каждому объекту — сводка: дни до сдачи, приход денег, баланс (касса), факт расход, начисления и выплаты бригадам. Статусы: в работе, новый, завершён, в архиве.',
                },
                {
                  title: 'Работы и расценки',
                  text: 'Справочник видов работ с расценками (за единицу объёма). Прорабы или офис вносят выполненные объёмы по объекту и бригаде. Система сама считает начисления по расценкам. Удобно смотреть, кто сколько сделал и сколько начислено.',
                },
                {
                  title: 'Расходы и выплаты бригадам',
                  text: 'Учёт прочих расходов по объекту (материалы, транспорт и т.п.) и фактических выплат бригадам. Видно приход денег, освоение бюджета, структуру расходов (бригады / прочие) и по категориям. План-факт по объекту в одном экране.',
                },
                {
                  title: 'Подрядчики и контакты',
                  text: 'Справочник бригад (подрядчиков) с привязкой к объектам. По каждой бригаде — начислено и выплачено. Поиск, сортировка, удобная таблица на десктопе и в мобильной версии.',
                },
                {
                  title: 'План-факт и риск',
                  text: 'Сравнение плановой себестоимости с фактическими расходами. Индикатор риска по объекту. Оплата контракта и освоение бюджета — в процентах и в деньгах, с наглядными шкалами.',
                },
                {
                  title: 'Несколько объектов и роли',
                  text: 'Все объекты в одном аккаунте: список с фильтром по статусу и поиском. Разделение прав: администратор настраивает объекты и справочники, прорабы могут вносить работы. Журнал действий (AuditLog) фиксирует изменения для контроля.',
                },
              ].map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 2 } }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.55 }}>
                        {item.text}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* КАК ЭТО РАБОТАЕТ */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  ПРОСТОЙ СТАРТ
                </Typography>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Как это работает
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                  Запуск — часы, не месяцы. Создаёте объект, добавляете бригады и расценки.
                  Прорабы или офис вводят объёмы работ, вы видите начисления и план-факт в одном месте. Без внедренцев.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Grid container spacing={2}>
                  {[
                    { step: '1', title: 'Создайте объект', text: 'Укажите название, даты, сумму контракта и плановую себестоимость. Добавьте бригады и виды работ с расценками.' },
                    { step: '2', title: 'Вносите работы и выплаты', text: 'Фиксируйте выполненные объёмы по бригадам — начисления считаются автоматически. Вносите фактические расходы и выплаты.' },
                    { step: '3', title: 'Смотрите сводку и план-факт', text: 'По каждому объекту: приход денег, баланс, факт расход, начисления и выплаты. Риск и освоение бюджета — на одном экране.' },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={item.step}>
                      <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', position: 'relative' }}>
                        <CardContent sx={{ p: { xs: 2.5, sm: 2.5 } }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {item.step}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pr: 4 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ДЛЯ КОГО / ПРЕИМУЩЕСТВА */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ДЛЯ КОГО
                </Typography>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Кому подходит Toratau
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 3 }}>
                  {[
                    'Малые подрядчики',
                    'Девелоперы',
                    'Компании с несколькими объектами',
                  ].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'primary.contrastText',
                          }}
                        />
                      </Box>
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ПРЕИМУЩЕСТВА
                </Typography>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Что вы получаете
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {[
                    {
                      title: 'Меньше перерасхода — экономия 3–7% бюджета',
                      text: 'План-факт по каждому объекту и бригаде. Вы видите отклонения до того, как они превращаются в потери.',
                    },
                    {
                      title: 'Выплаты без споров',
                      text: 'Каждая сумма привязана к объёмам и расценкам в системе. Нет «я сделал больше» — есть факт в одном месте.',
                    },
                    {
                      title: 'Контроль без тотальной опеки',
                      text: 'Руководство видит маржу и риски по объектам. Не нужно выбивать отчёты у прорабов и сводить таблицы.',
                    },
                    {
                      title: 'Один вход — все объекты',
                      text: 'Объекты, бригады, работы и выплаты в одном интерфейсе. История действий сохраняется — можно проверить любое решение.',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.title}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          height: '100%',
                          borderColor: 'transparent',
                          bgcolor:
                            theme.palette.mode === 'light'
                              ? 'common.white'
                              : 'grey.900',
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2.5, sm: 2 } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.5 }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* МОБИЛЬНАЯ ВЕРСИЯ */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  МОБИЛЬНАЯ ВЕРСИЯ
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Удобно с телефона: объекты, бюджет и подрядчики под рукой
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 520, lineHeight: 1.6 }}>
                  Сводка по объекту, финансы, структура расходов и таблица подрядчиков —
                  в удобном мобильном интерфейсе. Проверяйте цифры и принимайте решения без ноутбука.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: { xs: '100%', sm: 200, md: 200 },
                    maxWidth: 220,
                  }}
                >
                  <Box
                    component="img"
                    src="/mobile-screenshot-1.png"
                    alt="Мобильная версия — бюджет и структура расходов по объекту"
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Card>
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: { xs: '100%', sm: 200, md: 200 },
                    maxWidth: 220,
                  }}
                >
                  <Box
                    component="img"
                    src="/mobile-screenshot-2.png"
                    alt="Мобильная версия — список объектов и карточки проектов"
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ТАРИФЫ */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Stack spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                ТАРИФЫ
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Простая линейка тарифов
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                Стоимость указана за месяц использования портала. Цены за всю компанию; при оплате за год — скидка 10%.
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {[
                { name: 'Start', price: '1 500 ₽/мес', limit: 'До 3 объектов', highlighted: false },
                { name: 'Business', price: '3 000 ₽/мес', limit: 'До 6 объектов', highlighted: true },
                { name: 'Premium', price: '5 000 ₽/мес', limit: 'До 10 объектов', highlighted: false },
                { name: 'Unlim', price: '10 000 ₽/мес', limit: 'Объектов без ограничений', highlighted: false },
              ].map((plan) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={plan.name}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      height: '100%',
                      borderColor: plan.highlighted ? 'primary.main' : 'divider',
                      boxShadow: plan.highlighted ? 4 : 0,
                      position: 'relative',
                    }}
                  >
                    {plan.highlighted && (
                      <Chip
                        label="Популярный выбор"
                        color="primary"
                        size="small"
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                      />
                    )}
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                        {plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {plan.limit}
                      </Typography>
                      <Button
                        variant={plan.highlighted ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        href="/register"
                        sx={{ minHeight: { xs: 48 } }}
                      >
                        Начать бесплатно
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* FAQ */}
        <Box
          component="section"
          sx={{
            py: SECTION_PY,
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          }}
        >
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
                  FAQ
                </Typography>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Сомневаетесь? Вот ответы
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                  Типичные вопросы перед стартом — и короткие ответы, чтобы снять возражения и принять решение.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={1.5}>
                  {[
                    {
                      q: 'Сложно внедрять? Нужны ли программисты?',
                      a: 'Нет. Вы создаёте объекты и бригады, прорабы вводят объёмы работ. Запуск за 1–2 дня, без внедренцев. Инструкции и при необходимости онлайн-разбор первых шагов.',
                    },
                    {
                      q: 'Не заменяет ли это бухгалтерию? Придётся всё перестраивать?',
                      a: 'Toratau — управленческий учёт по объектам и бригадам. Бухгалтерию не трогаем: при необходимости выгружаете данные в нужном формате.',
                    },
                    {
                      q: 'Как считаются начисления бригадам?',
                      a: 'Задаёте расценки по видам работ. При вводе объёма система сама считает начисления по этапу и бригаде — без пересчётов в Excel.',
                    },
                    {
                      q: 'У нас несколько объектов. Всё в одной системе?',
                      a: 'Да. Один вход — все объекты. Детализация по каждому и сводная картина по компании. Так и задумано.',
                    },
                    {
                      q: 'Безопасно ли хранить данные у вас?',
                      a: 'Доступ по ролям, передача по защищённым каналам. Каждое действие фиксируется в журнале — можно проверить, кто что изменил.',
                    },
                    {
                      q: 'Чем это лучше Excel и чатов?',
                      a: 'Один источник правды: объёмы, начисления и выплаты в системе, а не в разрозненных файлах и переписках. План-факт в реальном времени, без ручных сводок.',
                    },
                    {
                      q: 'Что если не подойдёт после теста?',
                      a: '14 дней бесплатно, без карты. Не понравится — просто не продлеваете. Данные можно выгрузить.',
                    },
                  ].map((item, index) => (
                    <Accordion
                      key={index}
                      disableGutters
                      square={false}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: { xs: 2, sm: 2 },
                          minHeight: { xs: 52 },
                          '& .MuiAccordionSummary-content': { my: 1.5 },
                        }}
                      >
                        <Typography variant="subtitle2">
                          {item.q}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 2, pb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: 13.5 }}
                        >
                          {item.a}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ФИНАЛЬНЫЙ CTA */}
        <Box component="section" sx={{ py: SECTION_PY }}>
          <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
            <Card
              elevation={4}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'primary.main'
                    : 'primary.dark',
                color: 'primary.contrastText',
              }}
            >
              <Grid container>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Перестаньте терять на перерасходе — начните с одного объекта
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="inherit"
                        href="/register"
                        sx={{ color: 'primary.main', fontWeight: 600, minHeight: { xs: 48 } }}
                      >
                        Создать портал бесплатно
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        href="/login"
                        sx={{ borderColor: 'rgba(255,255,255,0.6)', color: 'inherit', minHeight: { xs: 48 } }}
                      >
                        Войти
                      </Button>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{ mt: 2, display: 'block', opacity: 0.8 }}
                    >
                      Без обязательств. Откажетесь — просто не продлеваете.
                    </Typography>
                  </Box>
                </Grid>
                <Grid
                  size={{ xs: 12, md: 5 }}
                  sx={{
                    borderLeft: {
                      xs: 'none',
                      md: '1px solid rgba(255,255,255,0.16)',
                    },
                    display: 'flex',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Мини mock-дашборд в CTA */}
                  <Box
                    sx={{
                      p: { xs: 3, md: 4 },
                      width: '100%',
                      bgcolor: 'rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.9, mb: 0.5 }}
                    >
                      Пример дашборда Toratau
                    </Typography>
                    <Card
                      sx={{
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.16)',
                        color: 'inherit',
                        boxShadow: 'none',
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="caption">
                            Прибыль по объектам
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.8 }}
                          >
                            месяц
                          </Typography>
                        </Stack>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mt: 0.5 }}
                        >
                          + 4 800 000 ₽
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'success.light' }}
                        >
                          +6,2% к плану
                        </Typography>
                      </CardContent>
                    </Card>
                    <Grid container spacing={1}>
                      {['Объекты', 'Бригады', 'Выплаты'].map((label, idx) => (
                        <Grid size={{ xs: 4 }} key={label}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              bgcolor: 'rgba(0,0,0,0.16)',
                              color: 'inherit',
                              boxShadow: 'none',
                            }}
                          >
                            <CardContent sx={{ p: 1.25 }}>
                              <Typography
                                variant="caption"
                                sx={{ opacity: 0.8 }}
                              >
                                {label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {idx === 0
                                  ? '7'
                                  : idx === 1
                                  ? '24'
                                  : '3,9 млн ₽'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{ borderTop: `1px solid ${theme.palette.divider}`, py: 2 }}
      >
        <Container maxWidth="lg" sx={{ px: CONTAINER_PX }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Toratau. Все права защищены.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Сервис для управления объектами в строительстве.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
